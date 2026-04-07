import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import settings
from app.database import AsyncSessionLocal
from app.models.user import User, UserRole

DEV_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.DEV_MODE:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).where(User.id == DEV_USER_ID))
            if not result.scalar_one_or_none():
                dev_user = User(
                    id=DEV_USER_ID,
                    email="dev@storystudio.local",
                    name="Dev User",
                    role=UserRole.admin,
                )
                session.add(dev_user)
                await session.commit()
    yield


app = FastAPI(title="AI Story Studio API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and register routers
from app.routers import auth, projects, presenters, scenes, videos, ai, script_versions, exports  # noqa: E402
# Ensure new models are imported so SQLAlchemy registers them
from app.models import script_version, project_export  # noqa: F401

app.include_router(auth.router,            prefix="/auth",       tags=["auth"])
app.include_router(projects.router,        prefix="/projects",   tags=["projects"])
app.include_router(presenters.router,      prefix="/presenters", tags=["presenters"])
app.include_router(scenes.router,          tags=["scenes"])
app.include_router(videos.router,          tags=["videos"])
app.include_router(ai.router,              prefix="/ai",         tags=["ai"])
app.include_router(script_versions.router, prefix="/projects",   tags=["script-versions"])
app.include_router(exports.router,         prefix="/projects",   tags=["exports"])


@app.get("/health")
async def health():
    return {"status": "ok"}
