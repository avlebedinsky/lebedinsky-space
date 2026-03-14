package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/handlers"
	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

func TestRSS_CreateFeed_InvalidBody_Returns400(t *testing.T) {
	h := handlers.NewRSSHandler(nil)
	req := withUser(httptest.NewRequest(http.MethodPost, "/rss/feeds", bytes.NewReader([]byte("not json"))), "lav", true)
	rec := httptest.NewRecorder()
	h.CreateFeed(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestRSS_CreateFeed_MissingURL_Returns400(t *testing.T) {
	h := handlers.NewRSSHandler(nil)
	body, _ := json.Marshal(map[string]any{"title": "No URL"})
	req := withUser(httptest.NewRequest(http.MethodPost, "/rss/feeds", bytes.NewReader(body)), "lav", true)
	rec := httptest.NewRecorder()
	h.CreateFeed(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestRSS_CreateFeed_MissingTitle_Returns400(t *testing.T) {
	h := handlers.NewRSSHandler(nil)
	body, _ := json.Marshal(map[string]any{"url": "https://example.com/feed"})
	req := withUser(httptest.NewRequest(http.MethodPost, "/rss/feeds", bytes.NewReader(body)), "lav", true)
	rec := httptest.NewRecorder()
	h.CreateFeed(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestRSS_ListFeeds_Empty(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM rss_feeds")

	h := handlers.NewRSSHandler(testPool)
	req := withUser(httptest.NewRequest(http.MethodGet, "/rss/feeds", nil), "lav", false)
	rec := httptest.NewRecorder()
	h.ListFeeds(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var feeds []models.RSSFeed
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&feeds))
	assert.Empty(t, feeds)
}

func TestRSS_CreateFeed_And_List(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM rss_feeds")

	h := handlers.NewRSSHandler(testPool)

	body, _ := json.Marshal(map[string]any{"title": "Go Blog", "url": "https://go.dev/blog/feed.atom"})
	req := withUser(httptest.NewRequest(http.MethodPost, "/rss/feeds", bytes.NewReader(body)), "lav", true)
	rec := httptest.NewRecorder()
	h.CreateFeed(rec, req)

	assert.Equal(t, http.StatusCreated, rec.Code)
	var feed models.RSSFeed
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&feed))
	assert.Equal(t, "Go Blog", feed.Title)
	assert.Equal(t, "https://go.dev/blog/feed.atom", feed.URL)
	assert.NotZero(t, feed.ID)

	req2 := withUser(httptest.NewRequest(http.MethodGet, "/rss/feeds", nil), "lav", false)
	rec2 := httptest.NewRecorder()
	h.ListFeeds(rec2, req2)

	var list []models.RSSFeed
	require.NoError(t, json.NewDecoder(rec2.Body).Decode(&list))
	require.Len(t, list, 1)
	assert.Equal(t, "Go Blog", list[0].Title)
}

func TestRSS_DeleteFeed(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM rss_feeds")

	h := handlers.NewRSSHandler(testPool)

	body, _ := json.Marshal(map[string]any{"title": "ToDelete", "url": "https://example.com/feed"})
	req := withUser(httptest.NewRequest(http.MethodPost, "/rss/feeds", bytes.NewReader(body)), "lav", true)
	rec := httptest.NewRecorder()
	h.CreateFeed(rec, req)

	var feed models.RSSFeed
	json.NewDecoder(rec.Body).Decode(&feed)

	req2 := withUser(httptest.NewRequest(http.MethodDelete, "/rss/feeds/"+itoa(feed.ID), nil), "lav", true)
	req2 = setURLParam(req2, "id", itoa(feed.ID))
	rec2 := httptest.NewRecorder()
	h.DeleteFeed(rec2, req2)

	assert.Equal(t, http.StatusNoContent, rec2.Code)
}

func TestRSS_FetchItems_Empty(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM rss_feeds")

	h := handlers.NewRSSHandler(testPool)
	req := withUser(httptest.NewRequest(http.MethodGet, "/rss/items", nil), "lav", false)
	rec := httptest.NewRecorder()
	h.FetchItems(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var result []models.RSSFeedWithItems
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&result))
	assert.Empty(t, result)
}

func TestRSS_FetchItems_CacheHit(t *testing.T) {
	skipIfNoDB(t)
	testPool.Exec(context.Background(), "DELETE FROM rss_feeds")

	h := handlers.NewRSSHandler(testPool)
	req := withUser(httptest.NewRequest(http.MethodGet, "/rss/items", nil), "lav", false)

	rec1 := httptest.NewRecorder()
	h.FetchItems(rec1, req)
	assert.Equal(t, http.StatusOK, rec1.Code)

	req2 := withUser(httptest.NewRequest(http.MethodGet, "/rss/items", nil), "lav", false)
	rec2 := httptest.NewRecorder()
	h.FetchItems(rec2, req2)
	assert.Equal(t, http.StatusOK, rec2.Code)
}
