package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

type SettingsHandler struct {
	db *pgxpool.Pool
}

func NewSettingsHandler(db *pgxpool.Pool) *SettingsHandler {
	return &SettingsHandler{db: db}
}

func (h *SettingsHandler) Get(w http.ResponseWriter, r *http.Request) {
	var gridOrderRaw string
	var s models.SiteSettings
	err := h.db.QueryRow(r.Context(),
		`SELECT bg_color, bg_image, card_color, accent_color, border_color, grid_order
		 FROM site_settings WHERE id=1`,
	).Scan(&s.BgColor, &s.BgImage, &s.CardColor, &s.AccentColor, &s.BorderColor, &gridOrderRaw)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	if err := json.Unmarshal([]byte(gridOrderRaw), &s.GridOrder); err != nil {
		s.GridOrder = []string{"clock", "weather", "metrics"}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}

func (h *SettingsHandler) Update(w http.ResponseWriter, r *http.Request) {
	var input models.SiteSettings
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if input.GridOrder == nil {
		input.GridOrder = []string{"clock", "weather", "metrics"}
	}

	gridOrderJSON, err := json.Marshal(input.GridOrder)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	var gridOrderRaw string
	var s models.SiteSettings
	err = h.db.QueryRow(r.Context(),
		`UPDATE site_settings
		 SET bg_color=$1, bg_image=$2, card_color=$3, accent_color=$4, border_color=$5, grid_order=$6
		 WHERE id=1
		 RETURNING bg_color, bg_image, card_color, accent_color, border_color, grid_order`,
		input.BgColor, input.BgImage, input.CardColor, input.AccentColor, input.BorderColor, string(gridOrderJSON),
	).Scan(&s.BgColor, &s.BgImage, &s.CardColor, &s.AccentColor, &s.BorderColor, &gridOrderRaw)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	if err := json.Unmarshal([]byte(gridOrderRaw), &s.GridOrder); err != nil {
		s.GridOrder = []string{"clock", "weather", "metrics"}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}
