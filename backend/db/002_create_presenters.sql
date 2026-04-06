CREATE TABLE IF NOT EXISTS presenters (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                 TEXT NOT NULL,
    age_range            TEXT,
    appearance_keywords  TEXT,
    speaking_style       TEXT,
    full_appearance      TEXT,
    is_template          BOOLEAN NOT NULL DEFAULT false,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presenters_user_id ON presenters(user_id);
