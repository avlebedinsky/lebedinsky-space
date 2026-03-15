package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/middleware"
	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

type MoodHandler struct {
	db *pgxpool.Pool
}

func NewMoodHandler(db *pgxpool.Pool) *MoodHandler {
	return &MoodHandler{db: db}
}

func (h *MoodHandler) List(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUser(r)
	rows, err := h.db.Query(r.Context(),
		`SELECT id, mood, note, created_at FROM mood_entries WHERE username = $1 ORDER BY created_at DESC`,
		user.Username,
	)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	entries := make([]models.MoodEntry, 0)
	for rows.Next() {
		var e models.MoodEntry
		if err := rows.Scan(&e.ID, &e.Mood, &e.Note, &e.CreatedAt); err != nil {
			continue
		}
		entries = append(entries, e)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entries)
}

func (h *MoodHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Mood int    `json:"mood"`
		Note string `json:"note"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if body.Mood < 1 || body.Mood > 5 {
		http.Error(w, "mood must be between 1 and 5", http.StatusBadRequest)
		return
	}

	user := middleware.GetUser(r)
	var e models.MoodEntry
	err := h.db.QueryRow(r.Context(),
		`INSERT INTO mood_entries (username, mood, note) VALUES ($1, $2, $3) RETURNING id, mood, note, created_at`,
		user.Username, body.Mood, body.Note,
	).Scan(&e.ID, &e.Mood, &e.Note, &e.CreatedAt)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(e)
}

func (h *MoodHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	user := middleware.GetUser(r)
	tag, err := h.db.Exec(r.Context(),
		`DELETE FROM mood_entries WHERE id = $1 AND username = $2`,
		id, user.Username,
	)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	if tag.RowsAffected() == 0 {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
