from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.presenter import SpeakingStyle


class PresenterCreate(BaseModel):
    name: str
    age_range: Optional[str] = None
    appearance_keywords: Optional[str] = None
    speaking_style: Optional[SpeakingStyle] = None
    full_appearance: Optional[str] = None
    is_template: bool = False


class PresenterUpdate(BaseModel):
    name: Optional[str] = None
    age_range: Optional[str] = None
    appearance_keywords: Optional[str] = None
    speaking_style: Optional[SpeakingStyle] = None
    full_appearance: Optional[str] = None
    is_template: Optional[bool] = None


class PresenterResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    age_range: Optional[str]
    appearance_keywords: Optional[str]
    speaking_style: Optional[SpeakingStyle]
    full_appearance: Optional[str]
    is_template: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
