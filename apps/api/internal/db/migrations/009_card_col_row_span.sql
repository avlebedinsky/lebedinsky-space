DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'card_span'
  ) THEN
    ALTER TABLE services RENAME COLUMN card_span TO card_col_span;
  END IF;
END $$;

ALTER TABLE services ADD COLUMN IF NOT EXISTS card_col_span INTEGER NOT NULL DEFAULT 1;
ALTER TABLE services ADD COLUMN IF NOT EXISTS card_row_span INTEGER NOT NULL DEFAULT 1;
