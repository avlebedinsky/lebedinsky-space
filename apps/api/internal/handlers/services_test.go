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

	body, _ := json.Marshal(map[string]any{"name": "ToDelete", "url": "https://x.com", "iconName": "X", "color": "#000"})
	req := withUser(httptest.NewRequest(http.MethodPost, "/services", bytes.NewReader(body)), "lav", true)
	rec := httptest.NewRecorder()
	h.Create(rec, req)
	var created models.Service
	json.NewDecoder(rec.Body).Decode(&created)

	req2 := withUser(httptest.NewRequest(http.MethodDelete, "/services/"+itoa(created.ID), nil), "lav", true)
	req2 = setURLParam(req2, "id", itoa(created.ID))
	rec2 := httptest.NewRecorder()
	h.Delete(rec2, req2)

	assert.Equal(t, http.StatusNoContent, rec2.Code)
}

func TestServices_Update(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM services")

	h := handlers.NewServicesHandler(testPool)

	body, _ := json.Marshal(map[string]any{"name": "Original", "url": "https://orig.com", "iconName": "Globe", "color": "#fff"})
	req := withUser(httptest.NewRequest(http.MethodPost, "/services", bytes.NewReader(body)), "lav", true)
	rec := httptest.NewRecorder()
	h.Create(rec, req)
	var created models.Service
	json.NewDecoder(rec.Body).Decode(&created)

	upd, _ := json.Marshal(map[string]any{"name": "Updated", "url": "https://updated.com", "iconName": "Globe", "color": "#000"})
	req2 := withUser(httptest.NewRequest(http.MethodPut, "/services/"+itoa(created.ID), bytes.NewReader(upd)), "lav", true)
	req2 = setURLParam(req2, "id", itoa(created.ID))
	rec2 := httptest.NewRecorder()
	h.Update(rec2, req2)

	assert.Equal(t, http.StatusOK, rec2.Code)
	var updated models.Service
	require.NoError(t, json.NewDecoder(rec2.Body).Decode(&updated))
	assert.Equal(t, "Updated", updated.Name)
	assert.Equal(t, "https://updated.com", updated.URL)
}

func TestServices_Update_InvalidID_Returns400(t *testing.T) {
	h := handlers.NewServicesHandler(nil)
	req := withUser(httptest.NewRequest(http.MethodPut, "/services/notanid", nil), "lav", true)
	req = setURLParam(req, "id", "notanid")
	rec := httptest.NewRecorder()
	h.Update(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestServices_Delete_InvalidID_Returns400(t *testing.T) {
	h := handlers.NewServicesHandler(nil)
	req := withUser(httptest.NewRequest(http.MethodDelete, "/services/notanid", nil), "lav", true)
	req = setURLParam(req, "id", "notanid")
	rec := httptest.NewRecorder()
	h.Delete(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestServices_Create_MissingURL_Returns400(t *testing.T) {
	h := handlers.NewServicesHandler(nil)
	body, _ := json.Marshal(map[string]any{"name": "NoURL"})
	req := withUser(httptest.NewRequest(http.MethodPost, "/services", bytes.NewReader(body)), "lav", true)
	rec := httptest.NewRecorder()
	h.Create(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestServices_Create_InvalidJSON_Returns400(t *testing.T) {
	h := handlers.NewServicesHandler(nil)
	req := withUser(httptest.NewRequest(http.MethodPost, "/services", bytes.NewReader([]byte("not json"))), "lav", true)
	rec := httptest.NewRecorder()
	h.Create(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestServices_Update_InvalidJSON_Returns400(t *testing.T) {
	h := handlers.NewServicesHandler(nil)
	req := withUser(httptest.NewRequest(http.MethodPut, "/services/1", bytes.NewReader([]byte("not json"))), "lav", true)
	req = setURLParam(req, "id", "1")
	rec := httptest.NewRecorder()
	h.Update(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
}
