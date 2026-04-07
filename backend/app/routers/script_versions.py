from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services import version_service

router = APIRouter()


class ScriptVersionResponse(BaseModel):
    id: UUID
    project_id: UUID
    version_number: int
    script: str
    word_count: Optional[int]
    tone: Optional[str]
    label: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/{project_id}/script-versions", response_model=list[ScriptVersionResponse])
async def list_script_versions(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await version_service.list_script_versions(db, project_id, current_user.id)
