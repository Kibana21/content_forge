CREATE TABLE IF NOT EXISTS scenes (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sequence_number       INTEGER NOT NULL,
    name                  TEXT,
    dialogue              TEXT,
    setting               TEXT,
    camera_framing        TEXT DEFAULT 'Medium close-up',
    time_start            INTEGER,
    time_end              INTEGER,
    merged_prompt         TEXT,
    storyboard_image_url  TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scenes_project_sequence ON scenes(project_id, sequence_number);
