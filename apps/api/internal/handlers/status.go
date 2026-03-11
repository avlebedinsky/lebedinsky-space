package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

type statusCache struct {
	status    string
	checkedAt time.Time
}

type StatusHandler struct {
	db    *pgxpool.Pool
	mu    sync.Mutex
	cache map[int64]statusCache
	ttl   time.Duration
}

func NewStatusHandler(db *pgxpool.Pool) *StatusHandler {
	return &StatusHandler{
		db:    db,
		cache: make(map[int64]statusCache),
		ttl:   30 * time.Second,
	}
}

func (h *StatusHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `SELECT id, url FROM services`)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type serviceRef struct {
		id  int64
		url string
	}
	var services []serviceRef
	for rows.Next() {
		var s serviceRef
		if err := rows.Scan(&s.id, &s.url); err != nil {
			continue
		}
		services = append(services, s)
	}

	now := time.Now()
	var toCheck []serviceRef
	h.mu.Lock()
	for _, s := range services {
		cached, ok := h.cache[s.id]
		if !ok || now.Sub(cached.checkedAt) > h.ttl {
			toCheck = append(toCheck, s)
		}
	}
	h.mu.Unlock()

	if len(toCheck) > 0 {
		results := make(chan models.ServiceStatus, len(toCheck))
		for _, s := range toCheck {
			go func(s serviceRef) {
				results <- checkService(s.id, s.url)
			}(s)
		}
		for range toCheck {
			result := <-results
			h.mu.Lock()
			h.cache[result.ID] = statusCache{status: result.Status, checkedAt: now}
			h.mu.Unlock()
		}
	}

	h.mu.Lock()
	statuses := make([]models.ServiceStatus, 0, len(services))
	for _, s := range services {
		cached, ok := h.cache[s.id]
		status := "unknown"
		if ok {
			status = cached.status
		}
		statuses = append(statuses, models.ServiceStatus{ID: s.id, Status: status})
	}
	h.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(statuses)
}

func checkService(id int64, url string) models.ServiceStatus {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodHead, url, nil)
	if err != nil {
		return models.ServiceStatus{ID: id, Status: "down"}
	}

	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return models.ServiceStatus{ID: id, Status: "down"}
	}
	resp.Body.Close()

	if resp.StatusCode < 500 {
		return models.ServiceStatus{ID: id, Status: "up"}
	}
	return models.ServiceStatus{ID: id, Status: "down"}
}
