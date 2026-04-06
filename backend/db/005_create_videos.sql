CREATE TABLE IF NOT EXISTS videos (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_title    TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'queued',
    progress_percent INTEGER NOT NULL DEFAULT 0,
    current_scene    INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER,
    file_url         TEXT,
    task_id          TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_videos_project_id ON videos(project_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status) WHERE status = 'rendering';
