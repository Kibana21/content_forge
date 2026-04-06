CREATE TABLE IF NOT EXISTS projects (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    presenter_id     UUID REFERENCES presenters(id) ON DELETE SET NULL,
    title            TEXT NOT NULL,
    video_type       TEXT,
    target_audience  TEXT,
    target_duration  INTEGER,
    key_message      TEXT,
    brand_kit        TEXT,
    call_to_action   TEXT,
    script           TEXT,
    tone             TEXT,
    word_count       INTEGER,
    status           TEXT NOT NULL DEFAULT 'draft',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
