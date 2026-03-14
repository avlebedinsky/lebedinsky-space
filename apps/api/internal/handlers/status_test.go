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

func TestStatusHandler_List_Empty(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM services")

	h := handlers.NewStatusHandler(testPool)
	req := withUser(httptest.NewRequest(http.MethodGet, "/status", nil), "lav", false)
	rec := httptest.NewRecorder()
	h.List(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var statuses []models.ServiceStatus
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&statuses))
	assert.Empty(t, statuses)
}

func TestStatusHandler_List_WithService(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM services")

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer ts.Close()

	sh := handlers.NewServicesHandler(testPool)
	body, _ := json.Marshal(map[string]any{
		"name":     "TestSvc",
		"url":      ts.URL,
		"iconName": "Globe",
		"color":    "#fff",
	})
	createReq := withUser(httptest.NewRequest(http.MethodPost, "/services", bytes.NewReader(body)), "lav", true)
	createRec := httptest.NewRecorder()
	sh.Create(createRec, createReq)
	require.Equal(t, http.StatusCreated, createRec.Code)
	var created models.Service
	json.NewDecoder(createRec.Body).Decode(&created)

	h := handlers.NewStatusHandler(testPool)
	req := withUser(httptest.NewRequest(http.MethodGet, "/status", nil), "lav", false)
	rec := httptest.NewRecorder()
	h.List(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var statuses []models.ServiceStatus
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&statuses))
	require.Len(t, statuses, 1)
	assert.Equal(t, created.ID, statuses[0].ID)
	assert.Equal(t, "up", statuses[0].Status)
}

func TestStatusHandler_List_ServiceDown(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM services")

	sh := handlers.NewServicesHandler(testPool)
	body, _ := json.Marshal(map[string]any{
		"name":     "DeadSvc",
		"url":      "http://127.0.0.1:19999",
		"iconName": "Globe",
		"color":    "#f00",
	})
	createReq := withUser(httptest.NewRequest(http.MethodPost, "/services", bytes.NewReader(body)), "lav", true)
	createRec := httptest.NewRecorder()
	sh.Create(createRec, createReq)
	require.Equal(t, http.StatusCreated, createRec.Code)

	h := handlers.NewStatusHandler(testPool)
	req := withUser(httptest.NewRequest(http.MethodGet, "/status", nil), "lav", false)
	rec := httptest.NewRecorder()
	h.List(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var statuses []models.ServiceStatus
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&statuses))
	require.Len(t, statuses, 1)
	assert.Equal(t, "down", statuses[0].Status)
}
