from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.video import VideoStatus


class VideoGenerateRequest(BaseModel):
    version_title: Optional[str] = None


class VideoResponse(BaseModel):
    id: UUID
    project_id: UUID
    version_title: str
    status: VideoStatus
    progress_percent: int
    current_scene: int
    duration_seconds: Optional[int]
    file_url: Optional[str]
    task_id: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
