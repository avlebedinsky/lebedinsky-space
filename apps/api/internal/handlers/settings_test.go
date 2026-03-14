package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/handlers"
	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

func TestSettings_Update_InvalidBody_Returns400(t *testing.T) {
	h := handlers.NewSettingsHandler(nil)
	req := withUser(httptest.NewRequest(http.MethodPut, "/settings", bytes.NewReader([]byte("not json"))), "lav", true)
	rec := httptest.NewRecorder()
	h.Update(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestSettings_Get(t *testing.T) {
	skipIfNoDB(t)

	h := handlers.NewSettingsHandler(testPool)
	req := withUser(httptest.NewRequest(http.MethodGet, "/settings", nil), "lav", false)
	rec := httptest.NewRecorder()
	h.Get(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var s models.SiteSettings
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&s))
	assert.NotEmpty(t, s.GridOrder)
	assert.NotNil(t, s.HiddenWidgets)
	assert.NotNil(t, s.WidgetSpans)
}

func TestSettings_Update(t *testing.T) {
	skipIfNoDB(t)

	h := handlers.NewSettingsHandler(testPool)
	input := models.SiteSettings{
		BgColor:       "#1a1a2e",
		CardColor:     "#16213e",
		AccentColor:   "#0f3460",
		BorderColor:   "#1f2937",
		TextColor:     "#ffffff",
		GridOrder:     []string{"clock", "metrics", "weather"},
		HiddenWidgets: []string{"docker"},
		WidgetSpans:   map[string]models.WidgetSpan{"clock": {ColSpan: 2, RowSpan: 1}},
	}
	body, _ := json.Marshal(input)
	req := withUser(httptest.NewRequest(http.MethodPut, "/settings", bytes.NewReader(body)), "lav", true)
	rec := httptest.NewRecorder()
	h.Update(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var s models.SiteSettings
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&s))
	assert.Equal(t, []string{"clock", "metrics", "weather"}, s.GridOrder)
	assert.Equal(t, []string{"docker"}, s.HiddenWidgets)
	assert.Equal(t, 2, s.WidgetSpans["clock"].ColSpan)
}

func TestSettings_Update_NilSlices_DefaultsApplied(t *testing.T) {
	skipIfNoDB(t)

	h := handlers.NewSettingsHandler(testPool)
	body := []byte(`{"bgColor":"#000","cardColor":"#111","accentColor":"#222","borderColor":"#333","textColor":"#fff"}`)
	req := withUser(httptest.NewRequest(http.MethodPut, "/settings", bytes.NewReader(body)), "lav", true)
	rec := httptest.NewRecorder()
	h.Update(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var s models.SiteSettings
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&s))
	assert.NotEmpty(t, s.GridOrder)
	assert.NotNil(t, s.HiddenWidgets)
	assert.NotNil(t, s.WidgetSpans)
}
