from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
import json as _json

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services import version_service

router = APIRouter()


class ExportVersionResponse(BaseModel):
    id: UUID
    project_id: UUID
    version_number: int
    format: str
    export_json: str
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/{project_id}/exports", response_model=list[ExportVersionResponse])
async def list_exports(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await version_service.list_export_versions(db, project_id, current_user.id)
