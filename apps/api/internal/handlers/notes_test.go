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

func TestNotes_CreateAndList(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM notes")

	h := handlers.NewNotesHandler(testPool)

	body, _ := json.Marshal(map[string]any{"content": "Hello note", "pinned": false})
	req := withUser(httptest.NewRequest(http.MethodPost, "/notes", bytes.NewReader(body)), "lav", false)
	rec := httptest.NewRecorder()
	h.Create(rec, req)

	assert.Equal(t, http.StatusCreated, rec.Code)
	var created models.Note
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&created))
	assert.Equal(t, "Hello note", created.Content)
	assert.Equal(t, "lav", created.Username)

	// List только для lav
	req2 := withUser(httptest.NewRequest(http.MethodGet, "/notes", nil), "lav", false)
	rec2 := httptest.NewRecorder()
	h.List(rec2, req2)

	var list []models.Note
	require.NoError(t, json.NewDecoder(rec2.Body).Decode(&list))
	assert.Len(t, list, 1)
}

func TestNotes_IsolatedByUser(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM notes")

	h := handlers.NewNotesHandler(testPool)

	// lav создаёт заметку
	body, _ := json.Marshal(map[string]any{"content": "lav's note"})
	req := withUser(httptest.NewRequest(http.MethodPost, "/notes", bytes.NewReader(body)), "lav", false)
	rec := httptest.NewRecorder()
	h.Create(rec, req)
	assert.Equal(t, http.StatusCreated, rec.Code)

	// другой пользователь не видит заметки lav
	req2 := withUser(httptest.NewRequest(http.MethodGet, "/notes", nil), "other", false)
	rec2 := httptest.NewRecorder()
	h.List(rec2, req2)

	var list []models.Note
	require.NoError(t, json.NewDecoder(rec2.Body).Decode(&list))
	assert.Empty(t, list)
}

func TestNotes_Delete_OtherUserCantDelete(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM notes")

	h := handlers.NewNotesHandler(testPool)

	// lav создаёт заметку
	body, _ := json.Marshal(map[string]any{"content": "mine"})
	req := withUser(httptest.NewRequest(http.MethodPost, "/notes", bytes.NewReader(body)), "lav", false)
	rec := httptest.NewRecorder()
	h.Create(rec, req)
	var created models.Note
	json.NewDecoder(rec.Body).Decode(&created)

	// other пытается удалить
	req2 := withUser(httptest.NewRequest(http.MethodDelete, "/notes/"+itoa(created.ID), nil), "other", false)
	req2 = setURLParam(req2, "id", itoa(created.ID))
	rec2 := httptest.NewRecorder()
	h.Delete(rec2, req2)

	assert.Equal(t, http.StatusNotFound, rec2.Code)
}
