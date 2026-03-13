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

func TestDocker_ReturnsValidJSON(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/docker", nil)
	rec := httptest.NewRecorder()
	handlers.Docker(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "application/json", rec.Header().Get("Content-Type"))

	var result []models.ContainerInfo
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&result))

	// socket may or may not be available — both empty and non-empty are valid
	for _, c := range result {
		assert.NotEmpty(t, c.ID)
		assert.NotEmpty(t, c.State)
	}
}
