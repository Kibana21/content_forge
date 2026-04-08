# Content Forge — AI Story Studio

A guided web application that takes business users from a video idea through presenter definition, script writing, scene storyboarding, and AI video generation. Built for insurance marketing teams, agent trainers, and corporate communications.

---

## What it does

1. **Brief** — define video type, target audience, duration, brand kit, and CTA
2. **Presenter** — build a presenter profile with appearance keywords and speaking style; AI generates a full appearance description that locks across every scene
3. **Script** — write or AI-draft a script from the brief; version history saved on every AI action; tone rewrite chips (Warm & Personal, More Professional, Shorter, Stronger CTA)
4. **Storyboard** — AI splits the script into scenes; each scene card has inline-editable dialogue, setting, and camera framing; storyboard is linked to the script version it was generated from
5. **Export** — Full Package, Script Only, or Technical JSON; versioned export history with inline viewer
6. **Video generation** — Veo 3.1 generates scene 1, then extends each subsequent scene for visual continuity; real-time progress bar via Celery + Redis polling

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript 5, Tailwind CSS v4, Zustand 5, SWR |
| Backend | FastAPI 0.115, Python 3.12, SQLAlchemy 2 async, Pydantic v2 |
| Database | PostgreSQL 16 — plain numbered SQL migrations in `backend/db/` |
| AI (text) | google-genai ≥1.70, Vertex AI, `gemini-2.5-flash`, service account auth |
| AI (video) | Veo 3.1 via `veo-3.1-generate-001` — scene extension chaining |
| Background tasks | Celery 5 + Redis |
| Auth | Dev bypass — `DEV_MODE=true` uses hardcoded dev user |

---

## Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16 running locally
- Redis (local or cloud — RedisLabs works)
- Google Cloud project with Vertex AI enabled
- Service account key file (`video-key.json`) with `roles/aiplatform.user`

---

## Setup

### 1. Database

```bash
# Create DB and user
psql -U postgres -c "CREATE USER content_forge_user WITH PASSWORD 'your_password';"
psql -U postgres -c "CREATE DATABASE content_forge_db OWNER content_forge_user;"
psql -U postgres -d content_forge_db -c "GRANT ALL ON SCHEMA public TO content_forge_user;"
psql -U postgres -d content_forge_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO content_forge_user;"
psql -U postgres -d content_forge_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO content_forge_user;"

# Apply migrations in order
cd backend
for f in db/0*.sql; do psql -U content_forge_user -d content_forge_db -f "$f"; done
```

### 2. Backend

```bash
# Create and activate venv at project root
python3.12 -m venv .venv
source .venv/bin/activate

cd backend
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — fill in DATABASE_URL, REDIS_URL, GOOGLE_CLOUD_PROJECT, JWT_SECRET_KEY
```

`.env` values to set:

```env
DATABASE_URL=postgresql+asyncpg://content_forge_user:PASSWORD@localhost:5432/content_forge_db
REDIS_URL=redis://default:<password>@<host>:<port>/0
GEMINI_MODEL=gemini-2.5-flash
GOOGLE_APPLICATION_CREDENTIALS=../video-key.json
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1
VEO_MODEL=veo-3.1-generate-001
VIDEO_OUTPUT_DIR=output/videos
JWT_SECRET_KEY=change-this-to-a-long-random-string
ALLOWED_ORIGINS=["http://localhost:3000"]
DEV_MODE=true
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Running

Three terminals:

```bash
# Terminal 1 — API server
cd backend
source ../.venv/bin/activate
PYTHONPATH=. uvicorn app.main:app --reload --port 8000

# Terminal 2 — Celery worker (video generation)
cd backend
source ../.venv/bin/activate
python -m app.workers.celery_app

# Terminal 3 — Frontend
cd frontend
npm run dev
```

Open http://localhost:3000

---

## Database migrations

Migrations are plain numbered SQL files — no Alembic. Apply new changes manually:

```bash
psql -U content_forge_user -d content_forge_db -f backend/db/010_your_change.sql
```

Rules:
- Files must be idempotent (`IF NOT EXISTS`, `IF EXISTS`)
- All enum-like columns use `TEXT` — never `CREATE TYPE ... AS ENUM`
- New FKs must include `ON DELETE CASCADE` or `ON DELETE SET NULL`

---

## Project structure

```
content_forge/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── routers/         # FastAPI route handlers
│   │   ├── schemas/         # Pydantic request/response models
│   │   ├── services/        # Business logic
│   │   ├── workers/
│   │   │   ├── celery_app.py
│   │   │   └── tasks.py     # Veo video generation task
│   │   └── core/            # Auth, exceptions, dependencies
│   └── db/                  # Numbered SQL migration files
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   ├── components/
│   │   ├── editor/steps/    # 5-step wizard panels
│   │   ├── project/         # Project overview components
│   │   └── ui/              # Shared primitives (Button, Badge, etc.)
│   ├── hooks/               # SWR data fetchers + polling
│   ├── lib/
│   │   ├── api/             # Typed API client wrappers
│   │   └── types/           # TypeScript interfaces
│   └── stores/              # Zustand state stores
├── video-key.json           # Google service account (not committed)
└── .venv/                   # Shared Python venv (project root)
```

---

## Key data flows

**Presenter consistency**
`Presenter.full_appearance` is generated once by Gemini and injected into every `Scene.merged_prompt` at scene generation time. The "Presenter locked" tag on every scene card reflects this — it cannot be overridden per scene.

**Scene generation**
`POST /projects/{id}/scenes/generate` calls Gemini to split the script into N scenes (based on `target_duration`), stamps `project.storyboard_script_version`, and returns `{scenes, project}`. The storyboard page shows a staleness warning if the script has been updated since.

**Video generation (async)**
```
POST /projects/{id}/videos/generate
  → creates Video row (status: queued)
  → dispatches Celery task via Redis
  → Celery: generates Scene 1 with Veo, extends for each subsequent scene
  → progress_percent + current_scene updated after each scene
  → saves final .mp4 to output/videos/{id}.mp4
  → status → ready, file_url → /videos/{id}/stream
  → frontend polls every 5s, shows live progress bar
```

**Export versioning**
Every export creates a row in `project_exports` with the full JSON payload. The inline viewer on the Export page (and Project Overview) renders it as formatted JSON, structured scene cards (Full Package), or clean readable text (Script Only).

---

## API overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects` | List all projects |
| POST | `/projects` | Create project |
| GET | `/projects/{id}` | Project with scenes + videos |
| PATCH | `/projects/{id}` | Update project fields |
| DELETE | `/projects/{id}` | Delete project (cascades scenes + videos) |
| POST | `/projects/{id}/export` | Export (full_package / script_only / json) |
| GET | `/projects/{id}/scenes` | List scenes |
| POST | `/projects/{id}/scenes` | Insert scene (supports `insert_after_sequence`) |
| POST | `/projects/{id}/scenes/generate` | AI scene generation from script |
| PATCH | `/scenes/{id}` | Update scene fields |
| POST | `/projects/{id}/videos/generate` | Queue video generation |
| GET | `/videos/{id}/stream` | Stream generated .mp4 |
| POST | `/ai/draft-script` | AI script draft from brief |
| POST | `/ai/rewrite-script` | Tone rewrite |
| POST | `/ai/generate-appearance` | Presenter appearance from keywords |
| GET | `/projects/{id}/script-versions` | Script version history |
| GET | `/projects/{id}/exports` | Export version history |


## How to run the app

# content_forge

GRANT ALL ON SCHEMA public TO content_forge_user;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO content_forge_user;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO content_forge_user;

Mac backend % uvicorn app.main:app --reload --port 8000 

Mac backend python -m app.workers.celery_app

Mac frontend % npm run dev

