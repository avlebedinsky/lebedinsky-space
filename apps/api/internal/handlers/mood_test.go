package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/handlers"
	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

func TestMood_Create_InvalidBody_Returns400(t *testing.T) {
	h := handlers.NewMoodHandler(nil)
	req := withUser(httptest.NewRequest(http.MethodPost, "/mood", bytes.NewReader([]byte("not json"))), "lav", false)
	rec := httptest.NewRecorder()
	h.Create(rec, req)
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestMood_Create_MoodTooLow_Returns400(t *testing.T) {
	h := handlers.NewMoodHandler(nil)
	body, _ := json.Marshal(map[string]any{"mood": 0, "note": ""})
	req := withUser(httptest.NewRequest(http.MethodPost, "/mood", bytes.NewReader(body)), "lav", false)
	rec := httptest.NewRecorder()
	h.Create(rec, req)
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestMood_Create_MoodTooHigh_Returns400(t *testing.T) {
	h := handlers.NewMoodHandler(nil)
	body, _ := json.Marshal(map[string]any{"mood": 6, "note": ""})
	req := withUser(httptest.NewRequest(http.MethodPost, "/mood", bytes.NewReader(body)), "lav", false)
	rec := httptest.NewRecorder()
	h.Create(rec, req)
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestMood_List_Empty(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM mood_entries WHERE username = 'testuser'")

	h := handlers.NewMoodHandler(testPool)
	req := withUser(httptest.NewRequest(http.MethodGet, "/mood", nil), "testuser", false)
	rec := httptest.NewRecorder()
	h.List(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var entries []models.MoodEntry
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&entries))
	assert.Empty(t, entries)
}

func TestMood_Create_And_List(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM mood_entries WHERE username = 'testuser'")

	h := handlers.NewMoodHandler(testPool)

	// Create entry
	body, _ := json.Marshal(map[string]any{"mood": 4, "note": "feeling good"})
	req := withUser(httptest.NewRequest(http.MethodPost, "/mood", bytes.NewReader(body)), "testuser", false)
	rec := httptest.NewRecorder()
	h.Create(rec, req)

	assert.Equal(t, http.StatusCreated, rec.Code)
	var entry models.MoodEntry
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&entry))
	assert.Equal(t, 4, entry.Mood)
	assert.Equal(t, "feeling good", entry.Note)
	assert.NotZero(t, entry.ID)

	// List returns it
	req2 := withUser(httptest.NewRequest(http.MethodGet, "/mood", nil), "testuser", false)
	rec2 := httptest.NewRecorder()
	h.List(rec2, req2)

	assert.Equal(t, http.StatusOK, rec2.Code)
	var entries []models.MoodEntry
	require.NoError(t, json.NewDecoder(rec2.Body).Decode(&entries))
	require.Len(t, entries, 1)
	assert.Equal(t, 4, entries[0].Mood)
}

func TestMood_MultipleEntriesPerDay(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM mood_entries WHERE username = 'testuser2'")

	h := handlers.NewMoodHandler(testPool)

	for i, mood := range []int{1, 3, 5} {
		body, _ := json.Marshal(map[string]any{"mood": mood, "note": fmt.Sprintf("entry %d", i)})
		req := withUser(httptest.NewRequest(http.MethodPost, "/mood", bytes.NewReader(body)), "testuser2", false)
		rec := httptest.NewRecorder()
		h.Create(rec, req)
		assert.Equal(t, http.StatusCreated, rec.Code)
	}

	req := withUser(httptest.NewRequest(http.MethodGet, "/mood", nil), "testuser2", false)
	rec := httptest.NewRecorder()
	h.List(rec, req)

	var entries []models.MoodEntry
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&entries))
	assert.Len(t, entries, 3)
}

func TestMood_Delete(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM mood_entries WHERE username = 'testuser3'")

	h := handlers.NewMoodHandler(testPool)

	// Create
	body, _ := json.Marshal(map[string]any{"mood": 3, "note": ""})
	req := withUser(httptest.NewRequest(http.MethodPost, "/mood", bytes.NewReader(body)), "testuser3", false)
	rec := httptest.NewRecorder()
	h.Create(rec, req)
	require.Equal(t, http.StatusCreated, rec.Code)

	var entry models.MoodEntry
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&entry))

	// Delete
	delReq := withUser(
		setURLParam(httptest.NewRequest(http.MethodDelete, "/mood/"+itoa(entry.ID), nil), "id", itoa(entry.ID)),
		"testuser3", false,
	)
	delRec := httptest.NewRecorder()
	h.Delete(delRec, delReq)
	assert.Equal(t, http.StatusNoContent, delRec.Code)

	// Verify gone
	listReq := withUser(httptest.NewRequest(http.MethodGet, "/mood", nil), "testuser3", false)
	listRec := httptest.NewRecorder()
	h.List(listRec, listReq)
	var entries []models.MoodEntry
	require.NoError(t, json.NewDecoder(listRec.Body).Decode(&entries))
	assert.Empty(t, entries)
}

func TestMood_Delete_OtherUser_Returns404(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM mood_entries WHERE username IN ('owner', 'attacker')")

	h := handlers.NewMoodHandler(testPool)

	// Owner creates entry
	body, _ := json.Marshal(map[string]any{"mood": 5, "note": ""})
	req := withUser(httptest.NewRequest(http.MethodPost, "/mood", bytes.NewReader(body)), "owner", false)
	rec := httptest.NewRecorder()
	h.Create(rec, req)
	require.Equal(t, http.StatusCreated, rec.Code)

	var entry models.MoodEntry
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&entry))

	// Attacker tries to delete
	delReq := withUser(
		setURLParam(httptest.NewRequest(http.MethodDelete, "/mood/"+itoa(entry.ID), nil), "id", itoa(entry.ID)),
		"attacker", false,
	)
	delRec := httptest.NewRecorder()
	h.Delete(delRec, delReq)
	assert.Equal(t, http.StatusNotFound, delRec.Code)
}

func TestMood_Delete_NotFound_Returns404(t *testing.T) {
	skipIfNoDB(t)

	h := handlers.NewMoodHandler(testPool)
	req := withUser(
		setURLParam(httptest.NewRequest(http.MethodDelete, "/mood/999999", nil), "id", "999999"),
		"testuser", false,
	)
	rec := httptest.NewRecorder()
	h.Delete(rec, req)
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestMood_List_IsolatedByUser(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM mood_entries WHERE username IN ('alice', 'bob')")

	h := handlers.NewMoodHandler(testPool)

	body, _ := json.Marshal(map[string]any{"mood": 5, "note": "alice"})
	req := withUser(httptest.NewRequest(http.MethodPost, "/mood", bytes.NewReader(body)), "alice", false)
	rec := httptest.NewRecorder()
	h.Create(rec, req)
	require.Equal(t, http.StatusCreated, rec.Code)

	// Bob sees empty list
	listReq := withUser(httptest.NewRequest(http.MethodGet, "/mood", nil), "bob", false)
	listRec := httptest.NewRecorder()
	h.List(listRec, listReq)
	var entries []models.MoodEntry
	require.NoError(t, json.NewDecoder(listRec.Body).Decode(&entries))
	assert.Empty(t, entries)
}
