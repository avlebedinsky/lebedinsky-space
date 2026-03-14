package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/handlers"
	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

func TestMe_ReturnsUser(t *testing.T) {
	req := withUser(httptest.NewRequest(http.MethodGet, "/me", nil), "alice", false)
	rec := httptest.NewRecorder()
	handlers.Me(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var result models.User
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&result))
	assert.Equal(t, "alice", result.Username)
	assert.False(t, result.IsAdmin)
}

func TestMe_ReturnsAdmin(t *testing.T) {
	req := withUser(httptest.NewRequest(http.MethodGet, "/me", nil), "bob", true)
	rec := httptest.NewRecorder()
	handlers.Me(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var result models.User
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&result))
	assert.Equal(t, "bob", result.Username)
	assert.True(t, result.IsAdmin)
}
