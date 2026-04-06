from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Literal
from app.models.project import VideoType, ProjectStatus
from app.schemas.presenter import PresenterResponse
from app.schemas.scene import SceneResponse
from app.schemas.video import VideoResponse


class ProjectCreate(BaseModel):
    title: str
    video_type: Optional[VideoType] = None
    target_audience: Optional[str] = None
    target_duration: Optional[int] = None
    key_message: Optional[str] = None
    brand_kit: Optional[str] = None
    call_to_action: Optional[str] = None
    presenter_id: Optional[UUID] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    video_type: Optional[VideoType] = None
    target_audience: Optional[str] = None
    target_duration: Optional[int] = None
    key_message: Optional[str] = None
    brand_kit: Optional[str] = None
    call_to_action: Optional[str] = None
    script: Optional[str] = None
    tone: Optional[str] = None
    word_count: Optional[int] = None
    status: Optional[ProjectStatus] = None
    presenter_id: Optional[UUID] = None


class ProjectResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    video_type: Optional[VideoType]
    target_audience: Optional[str]
    target_duration: Optional[int]
    key_message: Optional[str]
    brand_kit: Optional[str]
    call_to_action: Optional[str]
    script: Optional[str]
    tone: Optional[str]
    word_count: Optional[int]
    status: ProjectStatus
    presenter_id: Optional[UUID]
    presenter: Optional[PresenterResponse]
    scenes: list[SceneResponse] = []
    videos: list[VideoResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    video_type: Optional[VideoType]
    target_duration: Optional[int]
    status: ProjectStatus
    presenter_id: Optional[UUID]
    presenter: Optional[PresenterResponse]
    scene_count: int = 0
    video_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectStatsResponse(BaseModel):
    total: int
    drafts: int
    exported: int
    in_review: int
    videos_generated: int


class ExportRequest(BaseModel):
    format: Literal["full_package", "script_only", "json"]
