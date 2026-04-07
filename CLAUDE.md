# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**AI Story Studio** — a guided web application that takes business users (insurance marketing teams, agent trainers, corporate communications) from a video idea through presenter definition, script writing, scene storyboarding, and structured export. The output is a scene package (Full Package, Script Only, or Technical JSON) that downstream AI video generation tools consume.

The product spec lives in `story.md`, the technical spec in `tech.md`, and the working UI prototype in `story_studio_mockup.html`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript 5, Tailwind CSS v4, Zustand 5, SWR |
| Backend | FastAPI 0.115, Python 3.12, SQLAlchemy 2 (async), Pydantic v2 |
| Database | PostgreSQL 16 — migrations via plain numbered SQL scripts in `backend/db/` |
| AI (text) | google-genai 1.x, Vertex AI mode, `gemini-2.5-flash`, service account auth via `video-key.json` |
| AI (video) | Stubbed Celery task — Veo to be wired in later. Do NOT change video model call logic. |
| Auth | Dev bypass — `DEV_MODE=true` returns hardcoded user `00000000-0000-0000-0000-000000000001` |
| Background tasks | Celery 5 + Redis (RedisLabs cloud) — used exclusively for video generation |

---

## Getting Started

### Prerequisites

- Python 3.12+, Node.js 20+, PostgreSQL 16
- Shared `.venv` lives at the **project root** (not inside `backend/`)

### Backend

```bash
cd backend

# Use the shared venv at project root
source ../.venv/bin/activate
pip install -r requirements.txt

# Apply DB schema (run in order against content_forge_db)
psql -U content_forge_user -d content_forge_db -f db/001_create_users.sql
psql -U content_forge_user -d content_forge_db -f db/002_create_presenters.sql
psql -U content_forge_user -d content_forge_db -f db/003_create_projects.sql
psql -U content_forge_user -d content_forge_db -f db/004_create_scenes.sql
psql -U content_forge_user -d content_forge_db -f db/005_create_videos.sql

# Run API server (always from backend/ with PYTHONPATH set)
PYTHONPATH=. ../.venv/bin/uvicorn app.main:app --reload --port 8000

# Run Celery worker (separate terminal)
PYTHONPATH=. ../.venv/bin/celery -A app.workers.celery_app worker --loglevel=info
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                         # http://localhost:3000
```

### Backend dev commands

```bash
pytest                        # all tests
pytest tests/test_projects.py # single file
pytest --cov=app              # with coverage
ruff check app/
ruff format app/
```

---

## What Has Been Built

### Backend — fully implemented

| Area | Endpoints | Notes |
|------|-----------|-------|
| Projects | `GET/POST /projects`, `GET/PATCH/DELETE /projects/{id}`, `POST /projects/{id}/export` | Delete cascades to scenes + videos |
| Scenes | `GET/POST /projects/{id}/scenes`, `POST /projects/{id}/scenes/generate`, `PATCH/DELETE /scenes/{id}`, `POST /projects/{id}/scenes/reorder` | `create` supports `insert_after_sequence` for mid-list insertion |
| Presenters | Full CRUD `/presenters` | |
| Videos | `GET /projects/{id}/videos`, `POST /projects/{id}/videos/generate`, `GET /videos/{id}`, `GET /videos/{id}/download`, `DELETE /videos/{id}` | Celery stub |
| AI | `POST /ai/generate-appearance`, `/ai/draft-script`, `/ai/rewrite-script`, `/ai/split-scenes` | All use Vertex AI text client |
| Auth | `GET /auth/me` returns dev user — no real OAuth needed in DEV_MODE | |
| Stats | `GET /projects/stats` — total, drafts, exported, in_review, videos_generated | |

### Frontend — fully implemented

**Dashboard (`/`)**
- Project grid with gradient thumbnails, status badges, presenter avatar
- Stats row (total, drafts, exported, videos generated)
- Filter tabs (All / Drafts / Exported / In Review)
- New Project card + button — creates project and navigates to editor
- Delete project from card: hover to reveal delete button, two-click confirm

**Project Overview (`/projects/[id]`)**
- Storyline summary cards (Brief, Presenter, Script, Storyboard)
- Scene timeline with dialogue preview
- Videos section with progress polling (every 5s while rendering)
- Delete project button in header with two-click confirm → redirects to dashboard

**Storyline Editor (`/projects/[id]/edit`)**
- Sticky stepper bar, completed steps clickable
- **Step 1 — Brief**: video type pills, audience, duration, key message, brand kit, CTA
- **Step 2 — Presenter**: saved presenter selector, appearance keywords, "Generate from keywords" AI button, speaking style
- **Step 3 — Script**: large textarea, "Auto-draft from brief" AI button, word count + duration bar, tone rewrite chips (Warm & Personal, More Professional, Shorter, Stronger CTA)
- **Step 4 — Storyboard**:
  - Scene cards with inline-editable name, dialogue (italic, left border), setting, camera framing dropdown
  - Explicit **Save** button per card (shows "Saved ✓" on success)
  - **Insert scene** between any two scenes via popup modal (name, dialogue, setting, camera)
  - "Add scene at start" and "Regenerate all scenes" buttons
  - Delete individual scenes
- **Step 5 — Review & Export**: stat cards, presenter summary, scene list, export format picker (Full Package / Script Only / Technical JSON), Export button

---

## Architecture

### Application Views

```
Dashboard  →  Project Overview  →  Storyline Editor (5-step wizard)
```

### Key Data Flow Patterns

**AI assists (Steps 2, 3, 4):**
- Frontend calls `/ai/*` → `ai_service.py` calls Vertex AI Gemini async → returns text → fills editable field

**Presenter appearance consistency:**
- `Presenter.full_appearance` stored once, auto-injected into `Scene.merged_prompt` at scene generation time
- "Presenter locked" + "Brand locked" tags shown on every scene card — users cannot override per-scene

**Scene insertion:**
- `POST /projects/{id}/scenes` with `insert_after_sequence: N` shifts all scenes with `sequence_number > N` up by 1, inserts new scene at `N+1`

**Video generation (async):**
```
POST /projects/{id}/videos/generate
  → creates Video row (status: queued)
  → dispatches generate_video_task to Celery via Redis
  → frontend polls GET /videos/{id} every 5s
  → progress_percent + current_scene updated per scene
  → status → ready when done
```

**Project delete cascade:**
- ORM: `cascade="all, delete-orphan"` on scenes + videos relationships
- DB: `ON DELETE CASCADE` on `scenes.project_id` and `videos.project_id` FKs

---

## Database

Migrations are **plain numbered SQL files** — no Alembic. New schema changes go in the next numbered file (e.g. `006_add_column_x.sql`) and must be applied manually. Files should be idempotent (`IF NOT EXISTS`, `IF EXISTS`).

**All enum-like columns use `TEXT` in SQL and `String` in SQLAlchemy** — never use PostgreSQL `CREATE TYPE ... AS ENUM` or `SAEnum`. Python enums are for application logic only.

### Key relationships

```
users → projects (user_id FK, ON DELETE CASCADE)
           ├── scenes (project_id FK, ON DELETE CASCADE)  — ordered by sequence_number
           └── videos (project_id FK, ON DELETE CASCADE)
users → presenters (user_id FK)
projects → presenters (presenter_id FK, nullable, ON DELETE SET NULL)
```

`Scene.merged_prompt` = dialogue + setting + presenter full_appearance + brand_kit — this is what gets sent to the video generation API.

---

## AI Service

**Text generation** (`backend/app/services/ai_service.py`):
- Client: `genai.Client(vertexai=True, project=..., location=..., credentials=..., http_options=HttpOptions(api_version="v1"))`
- Credentials loaded explicitly from `video-key.json` via `service_account.Credentials.from_service_account_file()` — do NOT rely on implicit env var pickup
- Model: `gemini-2.5-flash` (configured via `GEMINI_MODEL` in `.env`)
- Functions: `generate_appearance()`, `draft_script()`, `rewrite_script()`, `split_into_scenes()`

**Video generation**: stubbed — do not change the video task logic until Veo is ready to wire in.

---

## UI / Design

Tailwind CSS v4 — use `@import "tailwindcss"` in `globals.css`, **not** `@tailwind base/components/utilities` (v3 syntax).

All global styles live in `frontend/app/globals.css`. Components use class names directly — no CSS modules.

**Button variants:** `btn-primary`, `btn-outline`, `btn-ghost`, `btn-ai`, `btn-sm`, `btn-lg`

**Badge variants:** `badge-draft` (grey), `badge-exported` (green), `badge-review` (amber), `badge-rendering` (blue)

**Form primitives:** `form-control`, `form-label`, `form-hint`, `form-group`, `form-row`, `pill-group`/`pill`, `tone-chip`

**Scene card primitives:** `scene-card`, `scene-card-thumb`, `scene-card-body`, `scene-tag`, `scene-tag-lock`

**Design tokens:**
```
--primary: #0F766E   (teal)
--bg: #F5F5F4
--surface: #FFFFFF
--border: #E7E5E4
--text: #1C1917
--text-secondary: #78716C
--radius: 10px  /  --radius-lg: 14px
```

**Layout containers:** `dashboard-shell` and `project-shell` (max 1100px), `page-content` (max 860px, editor)

---

## Environment Variables

### Backend (`backend/.env`)

```
DATABASE_URL=postgresql+asyncpg://content_forge_user:PASSWORD@localhost:5432/content_forge_db
REDIS_URL=redis://default:<password>@<host>:<port>/0
GEMINI_API_KEY=...             # kept for reference, not used for text generation
GEMINI_MODEL=gemini-2.5-flash
GOOGLE_APPLICATION_CREDENTIALS=../video-key.json
GOOGLE_CLOUD_PROJECT=...
GOOGLE_CLOUD_LOCATION=us-central1
JWT_SECRET_KEY=...
ALLOWED_ORIGINS=["http://localhost:3000"]
DEV_MODE=true
```

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```
