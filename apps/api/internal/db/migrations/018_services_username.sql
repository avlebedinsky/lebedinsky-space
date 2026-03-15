ALTER TABLE services ADD COLUMN IF NOT EXISTS username TEXT NOT NULL DEFAULT '';
UPDATE services SET username = 'avleb' WHERE username = '';
