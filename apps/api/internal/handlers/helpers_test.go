package handlers_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/db"
	"github.com/avlebedinsky/lebedinsky-space/api/internal/middleware"
)

var testPool *pgxpool.Pool

func TestMain(m *testing.M) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		os.Exit(m.Run()) // unit-тесты без БД тоже запускаем
	}

	ctx := context.Background()
	pool, err := db.Connect(ctx, dbURL)
	if err != nil {
		panic("connect test db: " + err.Error())
	}
	if err := db.Migrate(ctx, pool); err != nil {
		panic("migrate test db: " + err.Error())
	}
	testPool = pool
	code := m.Run()
	pool.Close()
	os.Exit(code)
}

// withUser добавляет пользователя в контекст запроса через middleware.
func withUser(req *http.Request, username string, isAdmin bool) *http.Request {
	groups := ""
	if isAdmin {
		groups = "admin"
	}
	req.Header.Set("Remote-User", username)
	req.Header.Set("Remote-Groups", groups)

	// прогоняем через Auth middleware чтобы заполнить context
	var enriched *http.Request
	capture := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		enriched = r
	})
	rec := httptest.NewRecorder()
	middleware.Auth("admin", false)(capture).ServeHTTP(rec, req)
	return enriched
}

// skipIfNoDB пропускает тест если тестовая БД недоступна.
func skipIfNoDB(t *testing.T) {
	t.Helper()
	if testPool == nil {
		t.Skip("TEST_DATABASE_URL not set, skipping integration test")
	}
}
