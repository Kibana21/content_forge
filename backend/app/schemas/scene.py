from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class SceneUpdate(BaseModel):
    name: Optional[str] = None
    dialogue: Optional[str] = None
    setting: Optional[str] = None
    camera_framing: Optional[str] = None
    time_start: Optional[int] = None
    time_end: Optional[int] = None
    merged_prompt: Optional[str] = None
    storyboard_image_url: Optional[str] = None


class SceneResponse(BaseModel):
    id: UUID
    project_id: UUID
    sequence_number: int
    name: Optional[str]
    dialogue: Optional[str]
    setting: Optional[str]
    camera_framing: Optional[str]
    time_start: Optional[int]
    time_end: Optional[int]
    merged_prompt: Optional[str]
    storyboard_image_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SceneReorderRequest(BaseModel):
    scene_ids: list[UUID]
