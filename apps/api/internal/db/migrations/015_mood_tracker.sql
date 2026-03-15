CREATE TABLE mood_entries (
    id         SERIAL PRIMARY KEY,
    username   TEXT        NOT NULL,
    mood       SMALLINT    NOT NULL CHECK (mood BETWEEN 1 AND 5),
    note       TEXT        NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON mood_entries (username, created_at DESC);
