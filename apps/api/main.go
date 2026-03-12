package main

import (
	"context"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/config"
	"github.com/avlebedinsky/lebedinsky-space/api/internal/db"
	"github.com/avlebedinsky/lebedinsky-space/api/internal/handlers"
	"github.com/avlebedinsky/lebedinsky-space/api/internal/middleware"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect db: %v", err)
	}
	defer pool.Close()

	if err := db.Migrate(ctx, pool); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	log.Println("Database migrated")

	svc := handlers.NewServicesHandler(pool)
	status := handlers.NewStatusHandler(pool)

	r := chi.NewRouter()
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(corsMiddleware(cfg.Environment))
	r.Use(middleware.Auth(cfg.AdminGroup))

	r.Get("/me", handlers.Me)

	r.Get("/services", svc.List)
	r.Post("/services", middleware.RequireAdmin(http.HandlerFunc(svc.Create)).ServeHTTP)
	r.Put("/services/{id}", middleware.RequireAdmin(http.HandlerFunc(svc.Update)).ServeHTTP)
	r.Delete("/services/{id}", middleware.RequireAdmin(http.HandlerFunc(svc.Delete)).ServeHTTP)

	r.Get("/status", status.List)

	log.Printf("Starting on :%s (env=%s)", cfg.Port, cfg.Environment)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("server: %v", err)
	}
}

func corsMiddleware(env string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := "https://lebedinsky.space"
			if env == "development" {
				origin = "http://localhost:5173"
			}
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
