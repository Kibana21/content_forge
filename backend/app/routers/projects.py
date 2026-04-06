from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectStatsResponse, ExportRequest
)
from app.services import project_service

router = APIRouter()


@router.get("/stats", response_model=ProjectStatsResponse)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await project_service.get_stats(db, current_user.id)


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await project_service.get_user_projects(db, current_user.id)


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await project_service.create_project(db, body, current_user.id)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await project_service.get_project(db, project_id, current_user.id)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    body: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await project_service.update_project(db, project_id, body, current_user.id)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await project_service.delete_project(db, project_id, current_user.id)


@router.post("/{project_id}/export")
async def export_project(
    project_id: UUID,
    body: ExportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await project_service.export_project(db, project_id, current_user.id, body)
