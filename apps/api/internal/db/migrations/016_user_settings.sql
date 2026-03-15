CREATE TABLE IF NOT EXISTS user_settings (
  username       TEXT PRIMARY KEY,
  bg_color       TEXT NOT NULL DEFAULT '#030712',
  bg_image       TEXT NOT NULL DEFAULT '',
  card_color     TEXT NOT NULL DEFAULT '#111827',
  accent_color   TEXT NOT NULL DEFAULT '#818cf8',
  border_color   TEXT NOT NULL DEFAULT '#1f2937',
  text_color     TEXT NOT NULL DEFAULT '#ffffff',
  grid_order     TEXT NOT NULL DEFAULT '["clock","weather","metrics"]',
  hidden_widgets TEXT NOT NULL DEFAULT '[]',
  widget_spans   TEXT NOT NULL DEFAULT '{}'
);

ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS username TEXT NOT NULL DEFAULT '';

UPDATE rss_feeds SET username = 'avleb' WHERE username = '';
