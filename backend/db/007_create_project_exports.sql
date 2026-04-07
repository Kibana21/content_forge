CREATE TABLE IF NOT EXISTS project_exports (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_number   INTEGER NOT NULL,
    format           TEXT NOT NULL,  -- full_package | script_only | json
    export_json      TEXT NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_exports_project_id ON project_exports(project_id);
