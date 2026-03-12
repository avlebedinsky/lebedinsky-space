CREATE TABLE IF NOT EXISTS site_settings (
  id            INTEGER PRIMARY KEY DEFAULT 1,
  bg_color      TEXT NOT NULL DEFAULT '#030712',
  bg_image      TEXT NOT NULL DEFAULT '',
  card_color    TEXT NOT NULL DEFAULT '#111827',
  accent_color  TEXT NOT NULL DEFAULT '#818cf8',
  border_color  TEXT NOT NULL DEFAULT '#ffffff0f',
  grid_order    TEXT NOT NULL DEFAULT '["clock","weather","metrics"]'
);
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
