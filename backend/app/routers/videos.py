from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.video import VideoGenerateRequest, VideoResponse
from app.services import video_service

router = APIRouter()


@router.get("/projects/{project_id}/videos", response_model=list[VideoResponse])
async def list_videos(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await video_service.get_project_videos(db, project_id, current_user.id)


@router.post("/projects/{project_id}/videos/generate", response_model=VideoResponse, status_code=201)
async def generate_video(
    project_id: UUID,
    body: VideoGenerateRequest = VideoGenerateRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await video_service.generate_video(db, project_id, current_user.id, body)


@router.get("/videos/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await video_service.get_video(db, video_id, current_user.id)


@router.get("/videos/{video_id}/download")
async def download_video(
    video_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    video = await video_service.get_video(db, video_id, current_user.id)
    return {"download_url": video.file_url or "/placeholder-video.mp4"}


@router.delete("/videos/{video_id}", status_code=204)
async def delete_video(
    video_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await video_service.delete_video(db, video_id, current_user.id)
