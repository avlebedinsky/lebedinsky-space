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

func TestMetrics_ReturnsValidJSON(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	rec := httptest.NewRecorder()
	handlers.Metrics(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "application/json", rec.Header().Get("Content-Type"))

	var result models.ServerMetrics
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&result))

	assert.NotEmpty(t, result.Hostname)
	assert.GreaterOrEqual(t, result.CPU, 0.0)
	assert.LessOrEqual(t, result.CPU, 100.0)
	assert.GreaterOrEqual(t, result.RAM, 0.0)
	assert.LessOrEqual(t, result.RAM, 100.0)
	assert.GreaterOrEqual(t, result.Disk, 0.0)
	assert.LessOrEqual(t, result.Disk, 100.0)
	assert.GreaterOrEqual(t, result.Uptime, uint64(0))
	assert.GreaterOrEqual(t, result.NetIn, uint64(0))
	assert.GreaterOrEqual(t, result.NetOut, uint64(0))
}
