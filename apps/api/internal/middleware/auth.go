package middleware

import (
	"context"
	"net/http"
	"strings"
)

type contextKey string

const UserKey contextKey = "user"

type UserContext struct {
	Username string
	IsAdmin  bool
}

func Auth(adminGroup string, devMode bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			username := r.Header.Get("Remote-User")
			if username == "" && devMode {
				username = r.Header.Get("X-Dev-User")
			}
			if username == "" {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			groups := r.Header.Get("Remote-Groups")
			isAdmin := strings.Contains(groups, adminGroup)

			ctx := context.WithValue(r.Context(), UserKey, &UserContext{
				Username: username,
				IsAdmin:  isAdmin,
			})
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(UserKey).(*UserContext)
		if !ok || !user.IsAdmin {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func GetUser(r *http.Request) *UserContext {
	user, _ := r.Context().Value(UserKey).(*UserContext)
	return user
}
