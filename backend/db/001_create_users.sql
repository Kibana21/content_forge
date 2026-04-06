CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL UNIQUE,
    name        TEXT,
    picture     TEXT,
    google_id   TEXT UNIQUE,
    role        TEXT NOT NULL DEFAULT 'creator',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed dev user for DEV_MODE
INSERT INTO users (id, email, name, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'dev@storystudio.local', 'Dev User', 'admin')
ON CONFLICT (id) DO NOTHING;
