package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/middleware"
	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

func Me(w http.ResponseWriter, r *http.Request) {
	u := middleware.GetUser(r)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.User{
		Username: u.Username,
		IsAdmin:  u.IsAdmin,
	})
}
