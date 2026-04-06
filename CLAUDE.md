# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**AI Story Studio** — a guided web application that takes business users (insurance marketing teams, agent trainers, corporate communications) from a video idea through presenter definition, script writing, scene storyboarding, and structured export. The output is a scene package (Full Package, Script Only, or Technical JSON) that downstream AI video generation tools consume.

The product spec lives in `story.md`, the technical spec in `tech.md`, and the working UI prototype in `story_studio_mockup.html`. The codebase is in the **build phase** — `backend/` and `frontend/` directories are being created per the spec in `tech.md`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript 5, Tailwind CSS 3, Zustand 5, SWR |
| Backend | FastAPI 0.115, Python 3.12, SQLAlchemy 2 (async), Pydantic v2 |
| Database | PostgreSQL 16 — migrations via plain numbered SQL scripts in `backend/db/` |
| AI | google-genai 1.x (Gemini 2.0 Flash) — server-side only, API key auth |
| Auth | Google OAuth (google-auth 2.x) — ID token verified server-side, then app issues its own JWT |
| Background tasks | Celery 5 + Redis 7 — used exclusively for video generation |

---

## Getting Started

### Prerequisites

- Python 3.12+, Node.js 20+, PostgreSQL 16, Redis

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in DATABASE_URL, GEMINI_API_KEY, GOOGLE_CLIENT_ID, etc.

# Apply DB schema (run in order)
psql -U postgres -d story_studio -f db/001_create_users.sql
psql -U postgres -d story_studio -f db/002_create_presenters.sql
psql -U postgres -d story_studio -f db/003_create_projects.sql
psql -U postgres -d story_studio -f db/004_create_scenes.sql
psql -U postgres -d story_studio -f db/005_create_videos.sql

# Run API server
uvicorn app.main:app --reload --port 8000

# Run Celery worker (separate terminal, same venv)
celery -A app.workers.celery_app worker --loglevel=info
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL, NEXT_PUBLIC_GOOGLE_CLIENT_ID
npm run dev                         # http://localhost:3000
```

### Backend dev commands

```bash
# Tests
pytest

# Single test file
pytest tests/test_projects.py

# With coverage
pytest --cov=app

# Lint / format
ruff check app/
ruff format app/
```

---

## Architecture

### Application Views (3)

```
Dashboard  →  Project Overview  →  Storyline Editor (5-step wizard)
```

| URL | View |
|-----|------|
| `/` | Dashboard — project grid, stats, filter tabs |
| `/projects/[id]` | Project Overview — storyline summary cards, scene timeline, generated videos |
| `/projects/[id]/edit` | Storyline Editor — wizard steps 1–5 |
| `/projects/[id]/edit?step=N` | Opens editor at a specific step |

### Wizard Steps

| Step | Name | Key action |
|------|------|-----------|
| 1 | Brief | Define video type, audience, duration, brand kit, CTA |
| 2 | Presenter | Create/select presenter profile; AI generates full appearance description from keywords |
| 3 | Script | Write or AI-draft script; tone chips trigger AI rewrites |
| 4 | Storyboard | AI splits script into N scenes; presenter appearance auto-injected into every scene's `merged_prompt` |
| 5 | Review & Export | Consistency check; export as Full Package, Script Only, or Technical JSON |

### Backend Structure

```
backend/app/
├── main.py              # FastAPI factory, CORS, router registration
├── config.py            # pydantic-settings (reads .env)
├── database.py          # async SQLAlchemy engine + session
├── models/              # SQLAlchemy ORM (user, project, presenter, scene, video)
├── schemas/             # Pydantic v2 request/response models
├── routers/             # Route handlers: auth, projects, presenters, scenes, videos, ai
├── services/            # Business logic: ai_service, auth_service, project_service, scene_service, video_service
├── core/                # security.py (JWT), dependencies.py (get_db, get_current_user), exceptions.py
└── workers/             # Celery: celery_app.py + tasks.py (generate_video_task)
```

### Frontend Structure

```
frontend/
├── app/                         # Next.js App Router pages
│   ├── page.tsx                 # Dashboard
│   ├── projects/[id]/page.tsx   # Project Overview
│   └── projects/[id]/edit/page.tsx  # Storyline Editor
├── components/
│   ├── dashboard/               # StatsRow, FilterTabs, ProjectGrid, ProjectCard
│   ├── project/                 # ProjectHero, StorylineGrid, SceneTimeline, VideosSection, VideoCard
│   ├── editor/                  # StepperBar, StepFooter, steps/ (StepBrief…StepReviewExport), SceneCard
│   └── ui/                      # Shared primitives: Button, Badge, Card, FormField, PillGroup, ToneChips, ProgressBar
├── stores/                      # Zustand: useAuthStore, useProjectStore, useEditorStore, usePresenterStore
├── hooks/                       # useProject, useProjects, useVideoPolling (polls every 5s), useAIAssist
└── lib/
    ├── api/                     # Axios client + per-resource modules (projects, presenters, scenes, videos, ai)
    └── types/                   # TypeScript types (project, presenter, scene, video)
```

### Key Data Flow Patterns

**AI assists (Steps 2, 3, 4):**
- Frontend calls `/ai/*` endpoints → `ai_service.py` calls Gemini async → returns text → user sees result in editable field

**Presenter appearance consistency:**
- `Presenter.full_appearance` is stored once and auto-injected into `Scene.merged_prompt` for every scene
- Users never manually manage this — indicated by "Presenter locked" tag on each scene card

**Video generation (async):**
```
POST /projects/{id}/videos/generate
  → creates Video row (status: queued)
  → dispatches generate_video_task to Celery via Redis
  → frontend polls GET /videos/{id} every 5s
  → progress_percent + current_scene updated per scene
  → status → ready when done
```

**Auth flow:**
- Frontend Google Sign-In → sends Google ID token to `POST /auth/google`
- Backend verifies with `google.oauth2.id_token.verify_oauth2_token()`
- Backend upserts user in DB, issues its own JWT
- All subsequent calls use app JWT (never the Google token)

---

## Database

Migrations are **plain numbered SQL files** — no Alembic. New schema changes go in the next numbered file (e.g. `006_add_column_x.sql`) and must be applied manually. Files should be idempotent (`IF NOT EXISTS`, `IF EXISTS`).

### Key relationships

```
users → projects (user_id FK)
           ├── scenes (project_id FK)  — sequence_number orders them
           └── videos (project_id FK)
users → presenters (user_id FK)
projects → presenters (presenter_id FK, nullable)
```

`Scene.merged_prompt` is the field sent to the video generation API — it contains dialogue + setting + injected presenter appearance.

---

## UI / Design Reference (`story_studio_mockup.html`)

The mockup is the source of truth for component design. Key CSS conventions used throughout:

**Button variants:** `btn-primary`, `btn-outline`, `btn-ghost`, `btn-ai`, `btn-sm`, `btn-lg`

**Badge variants:** `badge-draft` (grey), `badge-exported` (green), `badge-review` (amber), `badge-rendering` (blue)

**Form primitives:** `form-control`, `form-label`, `form-hint`, `form-group`, `form-row`, `pill-group`/`pill`, `tone-chip`

**Design tokens:**
```
--primary: #0F766E   (teal — brand colour)
--bg: #F5F5F4        (page background)
--surface: #FFFFFF   (card background)
--border: #E7E5E4
--text: #1C1917
--text-secondary: #78716C
--radius: 10px  /  --radius-lg: 14px
```

**Layout containers:** `dashboard-shell` and `project-shell` (max 1100px), `page-content` (max 860px, used in editor)

---

## Environment Variables

### Backend (`backend/.env`)

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/story_studio
REDIS_URL=redis://localhost:6379/0
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash
JWT_SECRET_KEY=...
ALLOWED_ORIGINS=["http://localhost:3000"]
```

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```
