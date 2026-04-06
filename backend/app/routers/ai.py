from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services import ai_service

router = APIRouter()


class AppearanceRequest(BaseModel):
    keywords: str


class AppearanceResponse(BaseModel):
    full_appearance: str


class DraftScriptRequest(BaseModel):
    video_type: Optional[str] = None
    target_audience: Optional[str] = None
    key_message: Optional[str] = None
    brand_kit: Optional[str] = None
    target_duration: Optional[int] = None
    call_to_action: Optional[str] = None


class DraftScriptResponse(BaseModel):
    script: str


class RewriteScriptRequest(BaseModel):
    script: str
    tone: str  # warm_personal | more_professional | shorter | stronger_cta


class RewriteScriptResponse(BaseModel):
    script: str


class SplitScenesRequest(BaseModel):
    script: str
    num_scenes: int
    presenter_name: Optional[str] = "Presenter"


@router.post("/generate-appearance", response_model=AppearanceResponse)
async def generate_appearance(
    body: AppearanceRequest,
    current_user: User = Depends(get_current_user),
):
    text = await ai_service.generate_appearance(body.keywords)
    return AppearanceResponse(full_appearance=text)


@router.post("/draft-script", response_model=DraftScriptResponse)
async def draft_script(
    body: DraftScriptRequest,
    current_user: User = Depends(get_current_user),
):
    script = await ai_service.draft_script(body.model_dump())
    return DraftScriptResponse(script=script)


@router.post("/rewrite-script", response_model=RewriteScriptResponse)
async def rewrite_script(
    body: RewriteScriptRequest,
    current_user: User = Depends(get_current_user),
):
    script = await ai_service.rewrite_script(body.script, body.tone)
    return RewriteScriptResponse(script=script)


@router.post("/split-scenes")
async def split_scenes(
    body: SplitScenesRequest,
    current_user: User = Depends(get_current_user),
):
    scenes = await ai_service.split_into_scenes(body.script, body.num_scenes, body.presenter_name or "Presenter")
    return {"scenes": scenes}
