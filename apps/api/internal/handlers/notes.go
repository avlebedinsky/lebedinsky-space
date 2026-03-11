package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/middleware"
	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

type NotesHandler struct {
	db *pgxpool.Pool
}

func NewNotesHandler(db *pgxpool.Pool) *NotesHandler {
	return &NotesHandler{db: db}
}

func (h *NotesHandler) List(w http.ResponseWriter, r *http.Request) {
	u := middleware.GetUser(r)

	rows, err := h.db.Query(r.Context(),
		`SELECT id, username, content, pinned, created_at, updated_at
		 FROM notes WHERE username=$1 ORDER BY pinned DESC, created_at DESC`,
		u.Username)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	notes := []models.Note{}
	for rows.Next() {
		var n models.Note
		if err := rows.Scan(&n.ID, &n.Username, &n.Content, &n.Pinned, &n.CreatedAt, &n.UpdatedAt); err != nil {
			continue
		}
		notes = append(notes, n)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notes)
}

func (h *NotesHandler) Create(w http.ResponseWriter, r *http.Request) {
	u := middleware.GetUser(r)

	var input struct {
		Content string `json:"content"`
		Pinned  bool   `json:"pinned"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	var n models.Note
	err := h.db.QueryRow(r.Context(),
		`INSERT INTO notes (username, content, pinned)
		 VALUES ($1, $2, $3)
		 RETURNING id, username, content, pinned, created_at, updated_at`,
		u.Username, input.Content, input.Pinned,
	).Scan(&n.ID, &n.Username, &n.Content, &n.Pinned, &n.CreatedAt, &n.UpdatedAt)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(n)
}

func (h *NotesHandler) Update(w http.ResponseWriter, r *http.Request) {
	u := middleware.GetUser(r)
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var input struct {
		Content string `json:"content"`
		Pinned  bool   `json:"pinned"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	var n models.Note
	err = h.db.QueryRow(r.Context(),
		`UPDATE notes SET content=$1, pinned=$2, updated_at=$3
		 WHERE id=$4 AND username=$5
		 RETURNING id, username, content, pinned, created_at, updated_at`,
		input.Content, input.Pinned, time.Now(), id, u.Username,
	).Scan(&n.ID, &n.Username, &n.Content, &n.Pinned, &n.CreatedAt, &n.UpdatedAt)
	if err != nil {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(n)
}

func (h *NotesHandler) Delete(w http.ResponseWriter, r *http.Request) {
	u := middleware.GetUser(r)
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	result, err := h.db.Exec(r.Context(),
		`DELETE FROM notes WHERE id=$1 AND username=$2`, id, u.Username)
	if err != nil || result.RowsAffected() == 0 {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
