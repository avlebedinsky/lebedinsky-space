package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/handlers"
	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

func TestServices_List_Empty(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM services")

	h := handlers.NewServicesHandler(testPool)
	req := withUser(httptest.NewRequest(http.MethodGet, "/services", nil), "lav", false)
	rec := httptest.NewRecorder()
	h.List(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var result []models.Service
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&result))
	assert.Empty(t, result)
}

func TestServices_Create_And_List(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM services")

	h := handlers.NewServicesHandler(testPool)

	body, _ := json.Marshal(map[string]any{
		"name":     "Test Service",
		"url":      "https://example.com",
		"iconName": "Globe",
		"color":    "#ffffff",
	})
	req := withUser(httptest.NewRequest(http.MethodPost, "/services", bytes.NewReader(body)), "lav", true)
	rec := httptest.NewRecorder()
	h.Create(rec, req)

	assert.Equal(t, http.StatusCreated, rec.Code)
	var created models.Service
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&created))
	assert.Equal(t, "Test Service", created.Name)
	assert.Equal(t, "https://example.com", created.URL)

	// List должен вернуть созданный сервис
	req2 := withUser(httptest.NewRequest(http.MethodGet, "/services", nil), "lav", false)
	rec2 := httptest.NewRecorder()
	h.List(rec2, req2)

	var list []models.Service
	require.NoError(t, json.NewDecoder(rec2.Body).Decode(&list))
	assert.Len(t, list, 1)
	assert.Equal(t, "Test Service", list[0].Name)
}

func TestServices_Create_MissingName_Returns400(t *testing.T) {
	skipIfNoDB(t)

	h := handlers.NewServicesHandler(testPool)
	body, _ := json.Marshal(map[string]any{"url": "https://example.com"})
	req := withUser(httptest.NewRequest(http.MethodPost, "/services", bytes.NewReader(body)), "lav", true)
	rec := httptest.NewRecorder()
	h.Create(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestServices_Delete(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM services")

	h := handlers.NewServicesHandler(testPool)

	// создаём сервис
	body, _ := json.Marshal(map[string]any{"name": "ToDelete", "url": "https://x.com", "iconName": "X", "color": "#000"})
	req := withUser(httptest.NewRequest(http.MethodPost, "/services", bytes.NewReader(body)), "lav", true)
	rec := httptest.NewRecorder()
	h.Create(rec, req)
	var created models.Service
	json.NewDecoder(rec.Body).Decode(&created)

	// удаляем через chi URL param
	req2 := withUser(httptest.NewRequest(http.MethodDelete, "/services/"+itoa(created.ID), nil), "lav", true)
	req2 = setURLParam(req2, "id", itoa(created.ID))
	rec2 := httptest.NewRecorder()
	h.Delete(rec2, req2)

	assert.Equal(t, http.StatusNoContent, rec2.Code)
}
