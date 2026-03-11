package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/middleware"
)

func okHandler(w http.ResponseWriter, r *http.Request) {
	u := middleware.GetUser(r)
	w.Header().Set("X-User", u.Username)
	if u.IsAdmin {
		w.Header().Set("X-Admin", "true")
	}
	w.WriteHeader(http.StatusOK)
}

func TestAuth_MissingUser_Returns401(t *testing.T) {
	handler := middleware.Auth("admin")(http.HandlerFunc(okHandler))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestAuth_RemoteUser_Passes(t *testing.T) {
	handler := middleware.Auth("admin")(http.HandlerFunc(okHandler))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Remote-User", "lav")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "lav", rec.Header().Get("X-User"))
	assert.Empty(t, rec.Header().Get("X-Admin"))
}

func TestAuth_AdminGroup_SetsIsAdmin(t *testing.T) {
	handler := middleware.Auth("admin")(http.HandlerFunc(okHandler))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Remote-User", "lav")
	req.Header.Set("Remote-Groups", "admin,users")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "true", rec.Header().Get("X-Admin"))
}

func TestAuth_DevFallback_XDevUser(t *testing.T) {
	handler := middleware.Auth("admin")(http.HandlerFunc(okHandler))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Dev-User", "devuser")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "devuser", rec.Header().Get("X-User"))
}

func TestRequireAdmin_NonAdmin_Returns403(t *testing.T) {
	handler := middleware.Auth("admin")(
		middleware.RequireAdmin(http.HandlerFunc(okHandler)),
	)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Remote-User", "lav")
	// нет Remote-Groups
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusForbidden, rec.Code)
}

func TestRequireAdmin_Admin_Passes(t *testing.T) {
	handler := middleware.Auth("admin")(
		middleware.RequireAdmin(http.HandlerFunc(okHandler)),
	)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Remote-User", "lav")
	req.Header.Set("Remote-Groups", "admin")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
}
