import os
import time
import asyncio
import uuid
import traceback
from sqlalchemy import select

from app.workers.celery_app import celery_app
from app.database import AsyncSessionLocal
from app.config import settings

# Import all models so SQLAlchemy can resolve all relationships before any DB query
from app.models.user import User  # noqa: F401
from app.models.project import Project  # noqa: F401
from app.models.presenter import Presenter  # noqa: F401
from app.models.scene import Scene
from app.models.video import Video, VideoStatus
from app.models.script_version import ScriptVersion  # noqa: F401
from app.models.project_export import ProjectExport  # noqa: F401


def _get_veo_client():
    from google import genai
    from google.oauth2 import service_account
    creds = service_account.Credentials.from_service_account_file(
        settings.GOOGLE_APPLICATION_CREDENTIALS,
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )
    return genai.Client(
        vertexai=True,
        project=settings.GOOGLE_CLOUD_PROJECT,
        location=settings.GOOGLE_CLOUD_LOCATION,
        credentials=creds,
    )


def _poll_until_done(client, operation, poll_interval: int = 20, max_wait: int = 900):
    """Poll a Veo long-running operation until it completes or times out."""
    elapsed = 0
    while not operation.done:
        if elapsed >= max_wait:
            raise TimeoutError(f"Veo operation did not complete within {max_wait}s")
        time.sleep(poll_interval)
        elapsed += poll_interval
        operation = client.operations.get(operation)

    # Check for server-side failure
    if operation.error:
        raise RuntimeError(f"Veo API error: {operation.error}")
    if not operation.response or not operation.response.generated_videos:
        raise RuntimeError("Veo returned an empty response — check model quota, prompt length, or content policy")

    return operation


async def _run_task(video_id: str):
    """
    Full async implementation — runs in a single event loop so asyncpg
    connections are never shared across loops.
    """

    async def _set_status(**kwargs):
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
            video = result.scalar_one_or_none()
            if video:
                for k, v in kwargs.items():
                    setattr(video, k, v)
                await db.commit()

    # ── Load video + scenes, mark rendering ──────────────────────────────────
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Video).where(Video.id == uuid.UUID(video_id)))
        video = result.scalar_one_or_none()
        if not video:
            return

        scenes_result = await db.execute(
            select(Scene)
            .where(Scene.project_id == video.project_id)
            .order_by(Scene.sequence_number)
        )
        scenes = [
            {"sequence_number": s.sequence_number, "merged_prompt": s.merged_prompt or ""}
            for s in scenes_result.scalars().all()
        ]

        video.status = VideoStatus.rendering
        await db.commit()

    if not scenes:
        await _set_status(status=VideoStatus.failed, error_message="No scenes found for this project")
        return

    total = len(scenes)
    loop = asyncio.get_running_loop()

    try:
        client = _get_veo_client()

        # Scene 1 — generate independently
        print(f"[video:{video_id}] Generating Scene 1 of {total}…")
        op = client.models.generate_videos(
            model=settings.VEO_MODEL,
            prompt=scenes[0]["merged_prompt"],
        )
        operation = await loop.run_in_executor(
            None, lambda o=op: _poll_until_done(client, o)
        )
        await _set_status(current_scene=1, progress_percent=int(1 / total * 100))
        print(f"[video:{video_id}] Scene 1 complete.")

        # Scenes 2-N — extend from previous output for visual continuity
        for i in range(1, total):
            prev_video = operation.response.generated_videos[0].video
            print(f"[video:{video_id}] Extending to Scene {i + 1} of {total}…")
            op = client.models.generate_videos(
                model=settings.VEO_MODEL,
                prompt=scenes[i]["merged_prompt"],
                video=prev_video,
            )
            operation = await loop.run_in_executor(
                None, lambda o=op: _poll_until_done(client, o)
            )
            await _set_status(
                current_scene=i + 1,
                progress_percent=int((i + 1) / total * 100),
            )
            print(f"[video:{video_id}] Scene {i + 1} complete.")

        # Save final extended video
        os.makedirs(settings.VIDEO_OUTPUT_DIR, exist_ok=True)
        output_path = os.path.join(settings.VIDEO_OUTPUT_DIR, f"{video_id}.mp4")
        operation.response.generated_videos[0].video.save(output_path)
        print(f"[video:{video_id}] Saved to {output_path}")

        await _set_status(
            status=VideoStatus.ready,
            progress_percent=100,
            file_url=f"/videos/{video_id}/stream",
            error_message=None,
        )

    except Exception as exc:
        error_msg = str(exc)
        print(f"[video:{video_id}] FAILED — {error_msg}\n{traceback.format_exc()}")
        await _set_status(status=VideoStatus.failed, error_message=error_msg[:2000])


@celery_app.task(bind=True)
def generate_video_task(self, video_id: str):
    asyncio.run(_run_task(video_id))


if __name__ == "__main__":
    celery_app.worker_main(["worker", "--loglevel=info"])
