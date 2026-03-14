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
	var gridOrderRaw, hiddenWidgetsRaw, widgetSpansRaw, kbAllowedFoldersRaw string
	var s models.SiteSettings
	err := h.db.QueryRow(r.Context(),
		`SELECT bg_color, bg_image, card_color, accent_color, border_color, text_color, grid_order, hidden_widgets, widget_spans, kb_repo_url, kb_allowed_folders
		 FROM site_settings WHERE id=1`,
	).Scan(&s.BgColor, &s.BgImage, &s.CardColor, &s.AccentColor, &s.BorderColor, &s.TextColor, &gridOrderRaw, &hiddenWidgetsRaw, &widgetSpansRaw, &s.KBRepoURL, &kbAllowedFoldersRaw)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	if err := json.Unmarshal([]byte(gridOrderRaw), &s.GridOrder); err != nil {
		s.GridOrder = []string{"clock", "weather", "metrics"}
	}
	if err := json.Unmarshal([]byte(hiddenWidgetsRaw), &s.HiddenWidgets); err != nil {
		s.HiddenWidgets = []string{}
	}
	if err := json.Unmarshal([]byte(widgetSpansRaw), &s.WidgetSpans); err != nil {
		s.WidgetSpans = map[string]models.WidgetSpan{}
	}
	if err := json.Unmarshal([]byte(kbAllowedFoldersRaw), &s.KBAllowedFolders); err != nil {
		s.KBAllowedFolders = []string{}
	}
	s.KBGithubToken = ""

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
	if input.HiddenWidgets == nil {
		input.HiddenWidgets = []string{}
	}
	if input.WidgetSpans == nil {
		input.WidgetSpans = map[string]models.WidgetSpan{}
	}
	if input.KBAllowedFolders == nil {
		input.KBAllowedFolders = []string{}
	}

	gridOrderJSON, err := json.Marshal(input.GridOrder)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	hiddenWidgetsJSON, err := json.Marshal(input.HiddenWidgets)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	widgetSpansJSON, err := json.Marshal(input.WidgetSpans)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	kbAllowedFoldersJSON, err := json.Marshal(input.KBAllowedFolders)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	var gridOrderRaw, hiddenWidgetsRaw, widgetSpansRaw, kbAllowedFoldersRaw string
	var s models.SiteSettings
	err = h.db.QueryRow(r.Context(),
		`UPDATE site_settings
		 SET bg_color=$1, bg_image=$2, card_color=$3, accent_color=$4, border_color=$5, text_color=$6,
		     grid_order=$7, hidden_widgets=$8, widget_spans=$9, kb_repo_url=$10,
		     kb_github_token = CASE WHEN $11 = '' THEN kb_github_token ELSE $11 END,
		     kb_allowed_folders=$12
		 WHERE id=1
		 RETURNING bg_color, bg_image, card_color, accent_color, border_color, text_color, grid_order, hidden_widgets, widget_spans, kb_repo_url, kb_allowed_folders`,
		input.BgColor, input.BgImage, input.CardColor, input.AccentColor, input.BorderColor, input.TextColor, string(gridOrderJSON), string(hiddenWidgetsJSON), string(widgetSpansJSON), input.KBRepoURL, input.KBGithubToken, string(kbAllowedFoldersJSON),
	).Scan(&s.BgColor, &s.BgImage, &s.CardColor, &s.AccentColor, &s.BorderColor, &s.TextColor, &gridOrderRaw, &hiddenWidgetsRaw, &widgetSpansRaw, &s.KBRepoURL, &kbAllowedFoldersRaw)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	if err := json.Unmarshal([]byte(gridOrderRaw), &s.GridOrder); err != nil {
		s.GridOrder = []string{"clock", "weather", "metrics"}
	}
	if err := json.Unmarshal([]byte(hiddenWidgetsRaw), &s.HiddenWidgets); err != nil {
		s.HiddenWidgets = []string{}
	}
	if err := json.Unmarshal([]byte(widgetSpansRaw), &s.WidgetSpans); err != nil {
		s.WidgetSpans = map[string]models.WidgetSpan{}
	}
	if err := json.Unmarshal([]byte(kbAllowedFoldersRaw), &s.KBAllowedFolders); err != nil {
		s.KBAllowedFolders = []string{}
	}
	s.KBGithubToken = ""

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}
