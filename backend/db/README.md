# Database Migrations

Plain numbered SQL scripts — applied manually via `psql` in order.

```bash
createdb story_studio

psql -U postgres -d story_studio -f db/001_create_users.sql
psql -U postgres -d story_studio -f db/002_create_presenters.sql
psql -U postgres -d story_studio -f db/003_create_projects.sql
psql -U postgres -d story_studio -f db/004_create_scenes.sql
psql -U postgres -d story_studio -f db/005_create_videos.sql
```

New schema changes: add the next numbered file (e.g. `006_add_column_x.sql`) and apply manually.
Each file should be idempotent (`IF NOT EXISTS`, `IF EXISTS`, `ON CONFLICT DO NOTHING`).



GRANT ALL ON SCHEMA public TO content_forge_user;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO content_forge_user;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO content_forge_user;

