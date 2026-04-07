-- Tracks which script version the current storyboard was generated from.
-- NULL means scenes were generated before this tracking was added, or no scenes exist.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS storyboard_script_version INTEGER;
