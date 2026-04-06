import time
import asyncio
import uuid
from sqlalchemy import select

from app.workers.celery_app import celery_app
from app.database import AsyncSessionLocal
from app.models.video import Video, VideoStatus
from app.models.scene import Scene


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True)
def generate_video_task(self, video_id: str):
    """
    Stub video generation task.
    Simulates rendering scene by scene with progress updates.
    Sets status=ready with a placeholder file_url when done.
    """
    async def _run():
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
            video = result.scalar_one_or_none()
            if not video:
                return

            # Get scene count
            scenes_result = await db.execute(
                select(Scene).where(Scene.project_id == video.project_id)
            )
            scenes = list(scenes_result.scalars().all())
            total = max(len(scenes), 1)

            video.status = VideoStatus.rendering
            await db.commit()

    _run_async(_run())

    # Simulate per-scene rendering
    async def _update_progress(scene_idx: int, total: int):
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
            video = result.scalar_one_or_none()
            if not video:
                return 0
            scenes_result = await db.execute(select(Scene).where(Scene.project_id == video.project_id))
            scenes = list(scenes_result.scalars().all())
            return len(scenes)

    total_scenes = _run_async(_update_progress(0, 1))
    total_scenes = max(total_scenes, 1)

    for i in range(total_scenes):
        time.sleep(5)  # simulate scene render time

        async def _set_progress(idx=i):
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
                video = result.scalar_one_or_none()
                if video:
                    video.current_scene = idx + 1
                    video.progress_percent = int(((idx + 1) / total_scenes) * 100)
                    await db.commit()

        _run_async(_set_progress())

    # Mark complete
    async def _complete():
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
            video = result.scalar_one_or_none()
            if video:
                video.status = VideoStatus.ready
                video.progress_percent = 100
                video.file_url = "/placeholder-video.mp4"
                await db.commit()

    _run_async(_complete())
