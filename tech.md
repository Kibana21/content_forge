# AI Story Studio — Technical Stack & Project Structure

---

## 1. Technology Stack Overview

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 15.x |
| Frontend language | TypeScript | 5.x |
| Frontend styling | Tailwind CSS | 3.x |
| Frontend state | Zustand | 5.x |
| Backend | FastAPI | 0.115.x |
| Backend language | Python | 3.12+ |
| Database | PostgreSQL | 16.x |
| ORM | SQLAlchemy (async) | 2.x |
| DB migrations | Plain SQL scripts | — |
| AI / Generative | google-genai (Gemini) | 1.x |
| Auth provider | google-auth | 2.x |
| Task queue | Celery + Redis | 5.x / 7.x |

---

## 2. Project Root Structure

```
content_forge/
├── backend/                  # FastAPI application
├── frontend/                 # Next.js application
├── .env.example              # Root-level env template
└── README.md
```

---

## 3. Backend — FastAPI

### 3.1 Folder Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app factory, middleware, router registration
│   ├── config.py                  # Settings via pydantic-settings (reads .env)
│   ├── database.py                # Async SQLAlchemy engine, session factory
│   │
│   ├── models/                    # SQLAlchemy ORM table definitions
│   │   ├── __init__.py
│   │   ├── base.py                # Declarative base, shared mixins (id, created_at, updated_at)
│   │   ├── user.py                # User accounts and roles
│   │   ├── project.py             # Video projects
│   │   ├── presenter.py           # Presenter profiles (reusable)
│   │   ├── scene.py               # Scenes belonging to a project
│   │   └── video.py               # Generated video versions
│   │
│   ├── schemas/                   # Pydantic v2 request/response schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── presenter.py
│   │   ├── scene.py
│   │   └── video.py
│   │
│   ├── routers/                   # API route handlers (one file per resource)
│   │   ├── __init__.py
│   │   ├── auth.py                # /auth — Google OAuth flow, token exchange, session
│   │   ├── projects.py            # /projects — CRUD + export
│   │   ├── presenters.py          # /presenters — CRUD for reusable profiles
│   │   ├── scenes.py              # /scenes — scene management per project
│   │   ├── videos.py              # /videos — generation trigger, status polling, download
│   │   └── ai.py                  # /ai — AI assist endpoints (draft, rewrite, appearance gen)
│   │
│   ├── services/                  # Business logic, decoupled from HTTP layer
│   │   ├── __init__.py
│   │   ├── ai_service.py          # Gemini API calls via google-genai
│   │   ├── auth_service.py        # Google OAuth token validation via google-auth
│   │   ├── project_service.py     # Project creation, export packaging, consistency checks
│   │   ├── scene_service.py       # Script-to-scene splitting, appearance injection
│   │   └── video_service.py       # Video generation dispatch, status tracking
│   │
│   ├── core/                      # Shared infrastructure
│   │   ├── __init__.py
│   │   ├── security.py            # JWT creation/validation, password hashing
│   │   ├── dependencies.py        # FastAPI dependency injectors (get_db, get_current_user)
│   │   └── exceptions.py          # Custom HTTP exception classes
│   │
│   └── workers/                   # Celery async task workers (video generation)
│       ├── __init__.py
│       ├── celery_app.py          # Celery instance and broker config
│       └── tasks.py               # generate_video_task — dispatched per video generation request
│
├── db/                            # Plain SQL scripts — run manually or via psql
│   ├── 001_create_users.sql
│   ├── 002_create_presenters.sql
│   ├── 003_create_projects.sql
│   ├── 004_create_scenes.sql
│   ├── 005_create_videos.sql
│   └── README.md                  # Instructions for applying scripts
│
├── tests/
│   ├── conftest.py                # Pytest fixtures (test DB, test client, auth tokens)
│   ├── test_projects.py
│   ├── test_presenters.py
│   ├── test_scenes.py
│   ├── test_videos.py
│   └── test_ai.py
│
├── requirements.txt               # Production dependencies
├── requirements-dev.txt           # Dev/test dependencies
└── .env.example
```

---

### 3.2 Key Backend Files

#### `app/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, projects, presenters, scenes, videos, ai
from app.config import settings

app = FastAPI(title="AI Story Studio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,       prefix="/auth",       tags=["auth"])
app.include_router(projects.router,   prefix="/projects",   tags=["projects"])
app.include_router(presenters.router, prefix="/presenters", tags=["presenters"])
app.include_router(scenes.router,     prefix="/scenes",     tags=["scenes"])
app.include_router(videos.router,     prefix="/videos",     tags=["videos"])
app.include_router(ai.router,         prefix="/ai",         tags=["ai"])
```

#### `app/config.py`
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str

    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    # google-genai (Gemini)
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"

settings = Settings()
```

#### `app/database.py`
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

---

### 3.3 Database Models

#### `app/models/base.py`
```python
from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase
import uuid

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class UUIDMixin:
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

#### `app/models/project.py`
```python
# Key fields (simplified)
class Project(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "projects"

    user_id          # FK → users.id
    title            # str
    video_type       # enum: product_explainer, educational, agent_training, social_ad, testimonial, corporate_update, compliance
    target_audience  # str
    target_duration  # int (seconds)
    key_message      # text
    brand_kit        # str
    call_to_action   # str
    script           # text
    tone             # str
    word_count       # int
    status           # enum: draft, in_review, exported
    presenter_id     # FK → presenters.id (nullable)

    # Relationships
    scenes           # List[Scene]
    videos           # List[Video]
```

#### `app/models/presenter.py`
```python
class Presenter(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "presenters"

    user_id              # FK → users.id
    name                 # str (e.g., "Maya - Friendly Advisor")
    age_range            # str
    appearance_keywords  # str
    speaking_style       # enum: warm_reassuring, confident_authoritative, energetic_motivational, calm_educational
    full_appearance      # text (the full lock description injected into every scene)
    is_template          # bool (saved for reuse across projects)
```

#### `app/models/scene.py`
```python
class Scene(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "scenes"

    project_id           # FK → projects.id
    sequence_number      # int
    name                 # str (e.g., "The Hook")
    dialogue             # text
    setting              # text (environment + action description)
    camera_framing       # str (e.g., "Medium close-up")
    time_start           # int (seconds)
    time_end             # int (seconds)
    merged_prompt        # text (dialogue + setting + injected appearance — sent to video tool)
    storyboard_image_url # str (nullable — thumbnail from AI image generation)
```

#### `app/models/video.py`
```python
class Video(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "videos"

    project_id           # FK → projects.id
    version_title        # str (e.g., "Version 1 — Full 60s Cut")
    status               # enum: queued, rendering, ready, failed
    progress_percent     # int (0–100)
    current_scene        # int (scene currently being rendered)
    duration_seconds     # int
    file_url             # str (nullable — available once ready)
    task_id              # str (Celery task ID — used to track or revoke the job)
```

---

### 3.4 AI Service — `app/services/ai_service.py`

Uses `google-genai` to call Gemini for:

| Function | Prompt purpose | Called from |
|----------|---------------|-------------|
| `generate_appearance()` | Turn appearance keywords → vivid full description | `/ai/generate-appearance` |
| `draft_script()` | Turn brief fields → first-draft script | `/ai/draft-script` |
| `rewrite_script()` | Rewrite script in a given tone | `/ai/rewrite-script` |
| `split_into_scenes()` | Split script into N scenes with names + setting suggestions | `/ai/split-scenes` |

```python
from google import genai
from app.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def generate_appearance(keywords: str) -> str:
    prompt = f"""
    You are helping create a consistent AI video presenter description.
    Based on these appearance keywords: "{keywords}"
    Write a detailed, vivid appearance description (3-5 sentences) that will be used
    to keep this presenter looking identical across every video scene.
    Focus on: hair, face, clothing, accessories, posture and demeanor.
    """
    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
    )
    return response.text

async def draft_script(brief: dict) -> str:
    prompt = f"""
    You are writing a video script for a {brief['video_type']} video.
    Target audience: {brief['target_audience']}
    Key message: {brief['key_message']}
    Tone: {brief['tone']}
    Target duration: {brief['target_duration']} seconds
    Call to action: {brief['call_to_action']}

    Write a natural, engaging script. Use plain language. No jargon.
    End with a clear, warm call to action.
    """
    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
    )
    return response.text
```

---

### 3.5 Auth Service — `app/services/auth_service.py`

Uses `google-auth` to validate Google OAuth tokens and extract user identity.

```python
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.config import settings

def verify_google_token(token: str) -> dict:
    """
    Verifies a Google ID token from the frontend OAuth flow.
    Returns the decoded claims (sub, email, name, picture).
    """
    request = google_requests.Request()
    claims = id_token.verify_oauth2_token(
        token,
        request,
        settings.GOOGLE_CLIENT_ID
    )
    return {
        "google_id": claims["sub"],
        "email":     claims["email"],
        "name":      claims.get("name"),
        "picture":   claims.get("picture"),
    }
```

The auth router (`/auth/google`) receives the Google ID token from the frontend, calls `verify_google_token()`, upserts the user in PostgreSQL, and issues a short-lived JWT for subsequent API calls.

---

### 3.6 API Endpoints

#### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/google` | Exchange Google ID token for app JWT |
| GET | `/auth/me` | Get current user profile |
| POST | `/auth/logout` | Invalidate session |

#### Projects
| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects` | List all projects for the current user |
| POST | `/projects` | Create new project |
| GET | `/projects/{id}` | Get single project with scenes and videos |
| PATCH | `/projects/{id}` | Update project fields |
| DELETE | `/projects/{id}` | Delete project |
| POST | `/projects/{id}/export` | Generate and return export package (format specified in body) |

#### Presenters
| Method | Path | Description |
|--------|------|-------------|
| GET | `/presenters` | List all presenter profiles for current user |
| POST | `/presenters` | Create new presenter profile |
| GET | `/presenters/{id}` | Get presenter profile |
| PATCH | `/presenters/{id}` | Update presenter |
| DELETE | `/presenters/{id}` | Delete presenter |

#### Scenes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects/{id}/scenes` | List all scenes for a project |
| POST | `/projects/{id}/scenes/generate` | Auto-generate scenes from project script |
| PATCH | `/scenes/{id}` | Update a single scene |
| DELETE | `/scenes/{id}` | Delete a scene |
| POST | `/scenes/reorder` | Reorder scenes (accepts array of IDs) |

#### Videos
| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects/{id}/videos` | List all video versions for a project |
| POST | `/projects/{id}/videos/generate` | Trigger new video generation (dispatches Celery task) |
| GET | `/videos/{id}` | Get video status and metadata |
| GET | `/videos/{id}/download` | Get signed download URL |
| DELETE | `/videos/{id}` | Delete a video version |

#### AI Assists
| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/generate-appearance` | Keywords → full appearance description |
| POST | `/ai/draft-script` | Brief → first-draft script |
| POST | `/ai/rewrite-script` | Script + tone → rewritten script |
| POST | `/ai/split-scenes` | Script + N → array of scenes with names and settings |

---

### 3.7 Backend Dependencies

#### `requirements.txt`
```
fastapi==0.115.5
uvicorn[standard]==0.32.1
sqlalchemy[asyncio]==2.0.36
asyncpg==0.30.0
pydantic==2.10.3
pydantic-settings==2.6.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.17
httpx==0.28.1
celery[redis]==5.4.0
redis==5.2.1
google-genai==1.14.0
google-auth==2.37.0
```

#### `requirements-dev.txt`
```
pytest==8.3.4
pytest-asyncio==0.24.0
httpx==0.28.1
factory-boy==3.3.1
coverage==7.6.9
ruff==0.8.4
```

---

### 3.8 Environment Variables — `backend/.env.example`

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/story_studio

# Redis (Celery broker)
REDIS_URL=redis://localhost:6379/0

# Google OAuth (google-auth)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Gemini (google-genai)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash

# JWT
JWT_SECRET_KEY=change-this-to-a-long-random-string
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080

# CORS
ALLOWED_ORIGINS=["http://localhost:3000"]

# App
APP_ENV=development
DEBUG=true
```

---

## 4. Frontend — Next.js

### 4.1 Folder Structure

```
frontend/
├── app/                                # Next.js App Router
│   ├── layout.tsx                      # Root layout — fonts, global providers
│   ├── page.tsx                        # Dashboard (View 1)
│   ├── globals.css                     # Tailwind base imports
│   │
│   ├── projects/
│   │   └── [id]/
│   │       ├── page.tsx                # Project Overview (View 2)
│   │       └── edit/
│   │           └── page.tsx            # Storyline Editor wrapper (View 3)
│   │
│   └── auth/
│       └── callback/
│           └── page.tsx                # Google OAuth callback handler
│
├── components/
│   │
│   ├── dashboard/                      # Dashboard-specific components
│   │   ├── StatsRow.tsx                # 4 stat cards
│   │   ├── FilterTabs.tsx              # All / Drafts / Exported / In Review
│   │   ├── ProjectGrid.tsx             # Responsive card grid
│   │   ├── ProjectCard.tsx             # Individual project card
│   │   └── NewProjectCard.tsx          # Dashed "Start New Project" card
│   │
│   ├── project/                        # Project Overview-specific components
│   │   ├── ProjectHero.tsx             # Title, metadata, action buttons
│   │   ├── StorylineGrid.tsx           # 2x2 grid of storyline summary cards
│   │   ├── StorylineCard.tsx           # Individual brief/presenter/script/storyboard card
│   │   ├── SceneTimeline.tsx           # Compact scene-by-scene list
│   │   ├── SceneTimelineRow.tsx        # Single row: num, thumb, name, dialogue, time
│   │   ├── VideosSection.tsx           # Generated videos header + grid
│   │   ├── VideoCard.tsx               # Individual video with play, status, actions
│   │   └── VideoCardRendering.tsx      # Variant shown while video is rendering
│   │
│   ├── editor/                         # Storyline Editor (wizard)
│   │   ├── StepperBar.tsx              # Horizontal progress stepper
│   │   ├── StepFooter.tsx              # Back / Continue navigation
│   │   │
│   │   └── steps/
│   │       ├── StepBrief.tsx           # Step 1: Brief fields
│   │       ├── StepPresenter.tsx       # Step 2: Presenter profile
│   │       ├── StepScript.tsx          # Step 3: Script editor + tone chips
│   │       ├── StepStoryboard.tsx      # Step 4: Scene cards list
│   │       ├── SceneCard.tsx           # Individual storyboard scene card
│   │       └── StepReviewExport.tsx    # Step 5: Summary + export format picker
│   │
│   └── ui/                             # Shared, generic UI primitives
│       ├── Badge.tsx                   # Status badges (Draft, Exported, In Review, Ready, Rendering)
│       ├── Button.tsx                  # btn-primary, btn-outline, btn-ghost, btn-ai, btn-sm, btn-lg
│       ├── Card.tsx                    # Standard surface card
│       ├── ConsistencyBanner.tsx       # Teal info banner for lock confirmation
│       ├── Breadcrumb.tsx              # Breadcrumb navigation
│       ├── PillGroup.tsx               # Pill selector (single-select)
│       ├── ToneChips.tsx               # Tone adjustment chip group
│       ├── FormField.tsx               # Label + input/textarea/select wrapper
│       └── ProgressBar.tsx             # Thin horizontal progress bar (for video rendering)
│
├── lib/
│   ├── api/
│   │   ├── client.ts                   # Axios instance with auth interceptor
│   │   ├── projects.ts                 # Project API calls
│   │   ├── presenters.ts               # Presenter API calls
│   │   ├── scenes.ts                   # Scene API calls
│   │   ├── videos.ts                   # Video API calls
│   │   └── ai.ts                       # AI assist API calls
│   │
│   ├── types/
│   │   ├── project.ts                  # Project, ProjectStatus, VideoType types
│   │   ├── presenter.ts                # Presenter types
│   │   ├── scene.ts                    # Scene types
│   │   └── video.ts                    # Video, VideoStatus types
│   │
│   └── utils/
│       ├── duration.ts                 # seconds → "1:02" formatting
│       └── wordCount.ts                # Word count + duration estimation
│
├── stores/                             # Zustand global state
│   ├── useAuthStore.ts                 # Current user, token, login/logout
│   ├── useProjectStore.ts              # Project list, selected project, CRUD
│   ├── useEditorStore.ts               # Active wizard step, unsaved changes
│   └── usePresenterStore.ts            # Presenter library
│
├── hooks/
│   ├── useProject.ts                   # SWR/React Query hook for single project
│   ├── useProjects.ts                  # SWR/React Query hook for project list
│   ├── useVideoPolling.ts              # Polls /videos/{id} every 5s while rendering
│   └── useAIAssist.ts                  # Handles loading state for AI button actions
│
├── public/
│   └── icons/
│
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.local.example
```

---

### 4.2 Key Frontend Files

#### `lib/api/client.ts`
```typescript
import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

export default apiClient;
```

#### `stores/useEditorStore.ts`
```typescript
import { create } from "zustand";

interface EditorStore {
  activeStep: 1 | 2 | 3 | 4 | 5;
  completedSteps: Set<number>;
  goToStep: (step: number) => void;
  markStepComplete: (step: number) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  activeStep: 1,
  completedSteps: new Set(),
  goToStep: (step) => set({ activeStep: step as 1 | 2 | 3 | 4 | 5 }),
  markStepComplete: (step) =>
    set((s) => ({ completedSteps: new Set([...s.completedSteps, step]) })),
}));
```

---

### 4.3 Routing Structure

| URL | View | Description |
|-----|------|-------------|
| `/` | Dashboard | Project grid, stats, filters |
| `/projects/[id]` | Project Overview | Storyline summary, scene timeline, videos |
| `/projects/[id]/edit` | Storyline Editor | 5-step wizard |
| `/projects/[id]/edit?step=2` | Storyline Editor | Opens directly at a given step |
| `/auth/callback` | Auth Callback | Handles Google OAuth redirect |

---

### 4.4 Frontend Dependencies

#### `package.json` (key dependencies)
```json
{
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "typescript": "5.7.2",
    "tailwindcss": "3.4.16",
    "axios": "1.7.9",
    "zustand": "5.0.2",
    "swr": "2.3.0",
    "@google/generative-ai": "0.21.0",
    "clsx": "2.1.1",
    "tailwind-merge": "2.5.5"
  },
  "devDependencies": {
    "eslint": "9.16.0",
    "eslint-config-next": "15.1.0",
    "@types/react": "19.0.1",
    "@types/node": "22.10.1"
  }
}
```

---

### 4.5 Environment Variables — `frontend/.env.local.example`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 5. Database Schema — PostgreSQL

### 5.1 Entity Relationship Overview

```
users
  └── projects (user_id FK)
        ├── scenes (project_id FK)
        └── videos (project_id FK)

users
  └── presenters (user_id FK)
        └── projects (presenter_id FK)  ← optional reference
```

### 5.2 Table Summary

| Table | Primary purpose |
|-------|----------------|
| `users` | User accounts, Google identity, role |
| `projects` | Video projects — brief, script, status, presenter reference |
| `presenters` | Reusable presenter profiles with full appearance descriptions |
| `scenes` | Individual scenes per project — dialogue, setting, merged prompt |
| `videos` | Generated video versions — status, progress, file URL |

### 5.3 Key Indexes

```sql
-- Fast lookup of a user's projects
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Fast lookup of scenes for a project, ordered
CREATE INDEX idx_scenes_project_sequence ON scenes(project_id, sequence_number);

-- Fast lookup of videos for a project
CREATE INDEX idx_videos_project_id ON videos(project_id);

-- Rendering status polling
CREATE INDEX idx_videos_status ON videos(status) WHERE status = 'rendering';
```

---

## 6. Background Tasks — Celery + Redis

Celery is used exclusively for video generation — the one operation that is too slow to run inside a request/response cycle. Redis acts as the message broker.

### Flow

```
POST /projects/{id}/videos/generate
    → Creates Video row (status: queued)
    → Dispatches generate_video_task.delay(video_id) to Celery
    → Returns video.id immediately to frontend

Celery worker picks up the task:
    → Sends each scene's merged_prompt to the video generation API
    → After each scene completes: updates progress_percent + current_scene in DB
    → On completion: sets status=ready, file_url

Frontend polls GET /videos/{id} every 5 seconds
    → Shows progress bar while status=rendering
    → Transitions to play button when status=ready
```

### `app/workers/celery_app.py`
```python
from celery import Celery
from app.config import settings

celery_app = Celery(
    "story_studio",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)
```

### `app/workers/tasks.py`
```python
from app.workers.celery_app import celery_app
from app.database import AsyncSessionLocal
from app.models.video import Video, VideoStatus

@celery_app.task(bind=True)
def generate_video_task(self, video_id: str):
    """
    Sends each scene's merged_prompt to the video generation API.
    Updates progress_percent and current_scene in the DB after each scene.
    Sets status=ready and file_url when all scenes are complete.
    """
    # ... implementation
```

---

## 7. Database — SQL Scripts

Migrations are managed as plain, numbered SQL files in `backend/db/`. Scripts are applied manually via `psql` in order.

### Folder structure

```
backend/db/
├── 001_create_users.sql
├── 002_create_presenters.sql
├── 003_create_projects.sql
├── 004_create_scenes.sql
├── 005_create_videos.sql
└── README.md
```

### Applying scripts

```bash
# Apply all scripts in order against a local database
psql -U postgres -d story_studio -f backend/db/001_create_users.sql
psql -U postgres -d story_studio -f backend/db/002_create_presenters.sql
psql -U postgres -d story_studio -f backend/db/003_create_projects.sql
psql -U postgres -d story_studio -f backend/db/004_create_scenes.sql
psql -U postgres -d story_studio -f backend/db/005_create_videos.sql
```

When adding new schema changes, create the next numbered file (e.g., `006_add_column_x.sql`) and apply it manually. Each file should be idempotent where possible (use `IF NOT EXISTS`, `IF EXISTS`).

---

## 8. Getting Started

### Prerequisites

* PostgreSQL 16 running locally
* Python 3.12+
* Node.js 20+

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd content_forge

# 2. Create the database
createdb story_studio

# 3. Apply SQL scripts
psql -U postgres -d story_studio -f backend/db/001_create_users.sql
psql -U postgres -d story_studio -f backend/db/002_create_presenters.sql
psql -U postgres -d story_studio -f backend/db/003_create_projects.sql
psql -U postgres -d story_studio -f backend/db/004_create_scenes.sql
psql -U postgres -d story_studio -f backend/db/005_create_videos.sql

# 4. Set up backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in DATABASE_URL, GEMINI_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
uvicorn app.main:app --reload --port 8000

# Start Celery worker (separate terminal, same venv)
celery -A app.workers.celery_app worker --loglevel=info

# 5. Set up frontend (new terminal)
cd frontend
npm install
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_API_URL, NEXT_PUBLIC_GOOGLE_CLIENT_ID
npm run dev

# 6. Open the app
open http://localhost:3000
```

---

## 9. google-genai Integration Notes

The `google-genai` Python library (v1.x) is used for all AI-assist features.

### Authentication

The library is initialised with an API key (not service account) — suitable for server-side use where the key is stored securely in the backend environment. The key is never exposed to the frontend.

```python
from google import genai
client = genai.Client(api_key=settings.GEMINI_API_KEY)
```

### Async usage

All AI service calls use the async client (`client.aio.models.generate_content`) so they do not block FastAPI's event loop.

### Model selection

`gemini-2.0-flash` is the default — fast and cost-effective for the short text generation tasks in this application (appearance descriptions, script drafts, script rewrites, scene splits). This is configurable via `GEMINI_MODEL` in `.env`.

---

## 10. google-auth Integration Notes

The `google-auth` library is used server-side **only** for verifying Google ID tokens that originate from the frontend OAuth flow.

### Flow

1. Frontend initiates Google Sign-In using the standard Google Identity Services JS library
2. On success, the frontend receives a Google **ID token** (a signed JWT from Google)
3. The frontend sends this ID token to `POST /auth/google`
4. The backend calls `google.oauth2.id_token.verify_oauth2_token()` to verify the token's signature against Google's public keys
5. The backend extracts the user's Google ID, email, and name
6. The backend upserts the user in PostgreSQL and issues its own short-lived JWT
7. All subsequent API calls use the app JWT, not the Google token

This means `google-auth` is used for **one purpose**: verifying the initial Google ID token. It is not used for ongoing session management.
