package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

type ServicesHandler struct {
	db *pgxpool.Pool
}

func NewServicesHandler(db *pgxpool.Pool) *ServicesHandler {
	return &ServicesHandler{db: db}
}

func (h *ServicesHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(),
		`SELECT id, name, description, url, icon_name, color, sort_order, hidden, card_col_span, card_row_span, created_at
		 FROM services ORDER BY sort_order, id`)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	services := []models.Service{}
	for rows.Next() {
		var s models.Service
		if err := rows.Scan(&s.ID, &s.Name, &s.Description, &s.URL, &s.IconName, &s.Color, &s.SortOrder, &s.Hidden, &s.CardColSpan, &s.CardRowSpan, &s.CreatedAt); err != nil {
			http.Error(w, "Internal error", http.StatusInternalServerError)
			return
		}
		services = append(services, s)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(services)
}

func (h *ServicesHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		URL         string `json:"url"`
		IconName    string `json:"iconName"`
		Color       string `json:"color"`
		SortOrder   int    `json:"sortOrder"`
		Hidden      bool   `json:"hidden"`
		CardColSpan int    `json:"cardColSpan"`
		CardRowSpan int    `json:"cardRowSpan"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	if input.Name == "" || input.URL == "" {
		http.Error(w, "name and url are required", http.StatusBadRequest)
		return
	}
	if input.CardColSpan < 1 {
		input.CardColSpan = 1
	}
	if input.CardRowSpan < 1 {
		input.CardRowSpan = 1
	}

	var s models.Service
	err := h.db.QueryRow(r.Context(),
		`INSERT INTO services (name, description, url, icon_name, color, sort_order, hidden, card_col_span, card_row_span)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING id, name, description, url, icon_name, color, sort_order, hidden, card_col_span, card_row_span, created_at`,
		input.Name, input.Description, input.URL, input.IconName, input.Color, input.SortOrder, input.Hidden, input.CardColSpan, input.CardRowSpan,
	).Scan(&s.ID, &s.Name, &s.Description, &s.URL, &s.IconName, &s.Color, &s.SortOrder, &s.Hidden, &s.CardColSpan, &s.CardRowSpan, &s.CreatedAt)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(s)
}

func (h *ServicesHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	var input struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		URL         string `json:"url"`
		IconName    string `json:"iconName"`
		Color       string `json:"color"`
		SortOrder   int    `json:"sortOrder"`
		Hidden      bool   `json:"hidden"`
		CardColSpan int    `json:"cardColSpan"`
		CardRowSpan int    `json:"cardRowSpan"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	if input.CardColSpan < 1 {
		input.CardColSpan = 1
	}
	if input.CardRowSpan < 1 {
		input.CardRowSpan = 1
	}

	var s models.Service
	err = h.db.QueryRow(r.Context(),
		`UPDATE services SET name=$1, description=$2, url=$3, icon_name=$4, color=$5, sort_order=$6, hidden=$7, card_col_span=$8, card_row_span=$9
		 WHERE id=$10
		 RETURNING id, name, description, url, icon_name, color, sort_order, hidden, card_col_span, card_row_span, created_at`,
		input.Name, input.Description, input.URL, input.IconName, input.Color, input.SortOrder, input.Hidden, input.CardColSpan, input.CardRowSpan, id,
	).Scan(&s.ID, &s.Name, &s.Description, &s.URL, &s.IconName, &s.Color, &s.SortOrder, &s.Hidden, &s.CardColSpan, &s.CardRowSpan, &s.CreatedAt)
	if err != nil {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}

func (h *ServicesHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "Invalid id", http.StatusBadRequest)
		return
	}

	result, err := h.db.Exec(r.Context(), `DELETE FROM services WHERE id=$1`, id)
	if err != nil || result.RowsAffected() == 0 {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
