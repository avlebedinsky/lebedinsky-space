CREATE TABLE IF NOT EXISTS rss_feeds (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  url        TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
