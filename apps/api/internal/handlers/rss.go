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

	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

type rssCache struct {
	items     []models.RSSFeedWithItems
	fetchedAt time.Time
}

type RSSHandler struct {
	db    *pgxpool.Pool
	mu    sync.Mutex
	cache *rssCache
	ttl   time.Duration
}

func NewRSSHandler(db *pgxpool.Pool) *RSSHandler {
	return &RSSHandler{
		db:  db,
		ttl: 5 * time.Minute,
	}
}

func (h *RSSHandler) ListFeeds(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `SELECT id, title, url, hidden, created_at FROM rss_feeds ORDER BY created_at ASC`)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	feeds := make([]models.RSSFeed, 0)
	for rows.Next() {
		var f models.RSSFeed
		if err := rows.Scan(&f.ID, &f.Title, &f.URL, &f.Hidden, &f.CreatedAt); err != nil {
			continue
		}
		feeds = append(feeds, f)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(feeds)
}

func (h *RSSHandler) CreateFeed(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Title string `json:"title"`
		URL   string `json:"url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Title == "" || body.URL == "" {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	var f models.RSSFeed
	err := h.db.QueryRow(r.Context(),
		`INSERT INTO rss_feeds (title, url) VALUES ($1, $2) RETURNING id, title, url, hidden, created_at`,
		body.Title, body.URL,
	).Scan(&f.ID, &f.Title, &f.URL, &f.Hidden, &f.CreatedAt)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	h.mu.Lock()
	h.cache = nil
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(f)
}

func (h *RSSHandler) UpdateFeed(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body struct {
		Title  string `json:"title"`
		URL    string `json:"url"`
		Hidden bool   `json:"hidden"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Title == "" || body.URL == "" {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	var f models.RSSFeed
	err := h.db.QueryRow(r.Context(),
		`UPDATE rss_feeds SET title = $1, url = $2, hidden = $3 WHERE id = $4 RETURNING id, title, url, hidden, created_at`,
		body.Title, body.URL, body.Hidden, id,
	).Scan(&f.ID, &f.Title, &f.URL, &f.Hidden, &f.CreatedAt)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	h.mu.Lock()
	h.cache = nil
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(f)
}

func (h *RSSHandler) DeleteFeed(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.db.Exec(r.Context(), `DELETE FROM rss_feeds WHERE id = $1`, id)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	h.mu.Lock()
	h.cache = nil
	h.mu.Unlock()

	w.WriteHeader(http.StatusNoContent)
}

func (h *RSSHandler) FetchItems(w http.ResponseWriter, r *http.Request) {
	h.mu.Lock()
	if h.cache != nil && time.Since(h.cache.fetchedAt) < h.ttl {
		cached := h.cache.items
		h.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(cached)
		return
	}
	h.mu.Unlock()

	rows, err := h.db.Query(r.Context(), `SELECT id, title, url, hidden, created_at FROM rss_feeds WHERE hidden = FALSE ORDER BY created_at ASC`)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var feeds []models.RSSFeed
	for rows.Next() {
		var f models.RSSFeed
		if err := rows.Scan(&f.ID, &f.Title, &f.URL, &f.Hidden, &f.CreatedAt); err != nil {
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
			items := parseFeed(f.URL)
			results <- result{index: idx, data: models.RSSFeedWithItems{Feed: f, Items: items}}
		}(i, feed)
	}

	grouped := make([]models.RSSFeedWithItems, len(feeds))
	for range feeds {
		r := <-results
		grouped[r.index] = r.data
	}

	h.mu.Lock()
	h.cache = &rssCache{items: grouped, fetchedAt: time.Now()}
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(grouped)
}

func parseFeed(url string) []models.RSSItem {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	fp := gofeed.NewParser()
	feed, err := fp.ParseURLWithContext(url, ctx)
	if err != nil {
		return []models.RSSItem{}
	}

	const maxItems = 10
	items := make([]models.RSSItem, 0, min(len(feed.Items), maxItems))
	for _, item := range feed.Items {
		if len(items) >= maxItems {
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
