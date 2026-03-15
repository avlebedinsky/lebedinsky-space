package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mmcdole/gofeed"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/middleware"
	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

type rssCache struct {
	items     []models.RSSFeedWithItems
	fetchedAt time.Time
}

type RSSHandler struct {
	db    *pgxpool.Pool
	mu    sync.Mutex
	cache map[string]*rssCache
	ttl   time.Duration
}

func NewRSSHandler(db *pgxpool.Pool) *RSSHandler {
	return &RSSHandler{
		db:    db,
		cache: make(map[string]*rssCache),
		ttl:   5 * time.Minute,
	}
}

func (h *RSSHandler) ListFeeds(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	rows, err := h.db.Query(r.Context(),
		`SELECT id, title, url, hidden, item_limit, created_at FROM rss_feeds WHERE username = $1 ORDER BY created_at ASC`,
		user.Username,
	)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	feeds := make([]models.RSSFeed, 0)
	for rows.Next() {
		var f models.RSSFeed
		if err := rows.Scan(&f.ID, &f.Title, &f.URL, &f.Hidden, &f.ItemLimit, &f.CreatedAt); err != nil {
			continue
		}
		feeds = append(feeds, f)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(feeds)
}

func (h *RSSHandler) CreateFeed(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	var body struct {
		Title     string `json:"title"`
		URL       string `json:"url"`
		ItemLimit int    `json:"itemLimit"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Title == "" || body.URL == "" {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	if body.ItemLimit <= 0 {
		body.ItemLimit = 10
	}

	var f models.RSSFeed
	err := h.db.QueryRow(r.Context(),
		`INSERT INTO rss_feeds (title, url, item_limit, username) VALUES ($1, $2, $3, $4) RETURNING id, title, url, hidden, item_limit, created_at`,
		body.Title, body.URL, body.ItemLimit, user.Username,
	).Scan(&f.ID, &f.Title, &f.URL, &f.Hidden, &f.ItemLimit, &f.CreatedAt)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	h.mu.Lock()
	delete(h.cache, user.Username)
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(f)
}

func (h *RSSHandler) UpdateFeed(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	id := chi.URLParam(r, "id")
	var body struct {
		Title     string `json:"title"`
		URL       string `json:"url"`
		Hidden    bool   `json:"hidden"`
		ItemLimit int    `json:"itemLimit"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Title == "" || body.URL == "" {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	if body.ItemLimit <= 0 {
		body.ItemLimit = 10
	}

	var f models.RSSFeed
	err := h.db.QueryRow(r.Context(),
		`UPDATE rss_feeds SET title = $1, url = $2, hidden = $3, item_limit = $4 WHERE id = $5 AND username = $6 RETURNING id, title, url, hidden, item_limit, created_at`,
		body.Title, body.URL, body.Hidden, body.ItemLimit, id, user.Username,
	).Scan(&f.ID, &f.Title, &f.URL, &f.Hidden, &f.ItemLimit, &f.CreatedAt)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	h.mu.Lock()
	delete(h.cache, user.Username)
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(f)
}

func (h *RSSHandler) DeleteFeed(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	id := chi.URLParam(r, "id")
	_, err := h.db.Exec(r.Context(), `DELETE FROM rss_feeds WHERE id = $1 AND username = $2`, id, user.Username)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	h.mu.Lock()
	delete(h.cache, user.Username)
	h.mu.Unlock()

	w.WriteHeader(http.StatusNoContent)
}

func (h *RSSHandler) FetchItems(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	username := user.Username

	h.mu.Lock()
	if c := h.cache[username]; c != nil && time.Since(c.fetchedAt) < h.ttl {
		cached := c.items
		h.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(cached)
		return
	}
	h.mu.Unlock()

	rows, err := h.db.Query(r.Context(),
		`SELECT id, title, url, hidden, item_limit, created_at FROM rss_feeds WHERE username = $1 AND hidden = FALSE ORDER BY created_at ASC`,
		username,
	)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var feeds []models.RSSFeed
	for rows.Next() {
		var f models.RSSFeed
		if err := rows.Scan(&f.ID, &f.Title, &f.URL, &f.Hidden, &f.ItemLimit, &f.CreatedAt); err != nil {
			continue
		}
		feeds = append(feeds, f)
	}

	type result struct {
		index int
		data  models.RSSFeedWithItems
	}

	results := make(chan result, len(feeds))
	for i, feed := range feeds {
		go func(idx int, f models.RSSFeed) {
			items := parseFeed(f.URL, f.ItemLimit)
			results <- result{index: idx, data: models.RSSFeedWithItems{Feed: f, Items: items}}
		}(i, feed)
	}

	grouped := make([]models.RSSFeedWithItems, len(feeds))
	for range feeds {
		r := <-results
		grouped[r.index] = r.data
	}

	h.mu.Lock()
	h.cache[username] = &rssCache{items: grouped, fetchedAt: time.Now()}
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(grouped)
}

func parseFeed(url string, limit int) []models.RSSItem {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	fp := gofeed.NewParser()
	feed, err := fp.ParseURLWithContext(url, ctx)
	if err != nil {
		return []models.RSSItem{}
	}

	items := make([]models.RSSItem, 0, min(len(feed.Items), limit))
	for _, item := range feed.Items {
		if len(items) >= limit {
			break
		}
		published := ""
		if item.PublishedParsed != nil {
			published = item.PublishedParsed.Format(time.RFC3339)
		} else if item.UpdatedParsed != nil {
			published = item.UpdatedParsed.Format(time.RFC3339)
		}
		items = append(items, models.RSSItem{
			Title:       item.Title,
			Link:        item.Link,
			Description: item.Description,
			Published:   published,
		})
	}
	return items
}
