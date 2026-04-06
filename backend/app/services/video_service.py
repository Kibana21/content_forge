from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.video import Video, VideoStatus
from app.models.project import Project
from app.schemas.video import VideoGenerateRequest
from app.core.exceptions import NotFoundError, ForbiddenError


async def get_project_videos(db: AsyncSession, project_id: UUID, user_id: UUID) -> list[Video]:
    proj = await db.execute(select(Project).where(Project.id == project_id))
    project = proj.scalar_one_or_none()
    if not project:
        raise NotFoundError("Project not found")
    if project.user_id != user_id:
        raise ForbiddenError()
    result = await db.execute(
        select(Video).where(Video.project_id == project_id).order_by(Video.created_at.desc())
    )
    return list(result.scalars().all())


async def get_video(db: AsyncSession, video_id: UUID, user_id: UUID) -> Video:
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise NotFoundError("Video not found")
    proj = await db.execute(select(Project).where(Project.id == video.project_id))
    project = proj.scalar_one_or_none()
    if not project or project.user_id != user_id:
        raise ForbiddenError()
    return video


async def generate_video(
    db: AsyncSession, project_id: UUID, user_id: UUID, req: VideoGenerateRequest
) -> Video:
    proj = await db.execute(select(Project).where(Project.id == project_id))
    project = proj.scalar_one_or_none()
    if not project:
        raise NotFoundError("Project not found")
    if project.user_id != user_id:
        raise ForbiddenError()

    # Count existing versions for auto-title
    count_result = await db.execute(select(Video).where(Video.project_id == project_id))
    existing_count = len(list(count_result.scalars().all()))
    version_title = req.version_title or f"Version {existing_count + 1}"

    video = Video(
        project_id=project_id,
        version_title=version_title,
        status=VideoStatus.queued,
        duration_seconds=project.target_duration,
    )
    db.add(video)
    await db.commit()
    await db.refresh(video)

    # Dispatch Celery task
    from app.workers.tasks import generate_video_task
    task = generate_video_task.delay(str(video.id))
    video.task_id = task.id
    await db.commit()
    await db.refresh(video)
    return video


async def delete_video(db: AsyncSession, video_id: UUID, user_id: UUID) -> None:
    video = await get_video(db, video_id, user_id)
    await db.delete(video)
    await db.commit()
