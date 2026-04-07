CREATE TABLE IF NOT EXISTS script_versions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_number   INTEGER NOT NULL,
    script           TEXT NOT NULL,
    word_count       INTEGER,
    tone             TEXT,
    label            TEXT,  -- e.g. "Auto-draft", "Rewrite: Warm & Personal", "Manual save"
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_script_versions_project_id ON script_versions(project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_script_versions_project_version ON script_versions(project_id, version_number);
