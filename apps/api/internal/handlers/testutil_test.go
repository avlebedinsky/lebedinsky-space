package handlers_test

import (
	"context"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// setURLParam добавляет chi URL параметр в запрос (для тестов без роутера).
func setURLParam(r *http.Request, key, value string) *http.Request {
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add(key, value)
	return r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
}

func itoa(id int64) string {
	return fmt.Sprintf("%d", id)
}
