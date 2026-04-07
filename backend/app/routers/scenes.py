from uuid import UUID
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.scene import SceneCreate, SceneUpdate, SceneResponse, SceneReorderRequest
from app.schemas.project import ProjectResponse
from app.services import scene_service, project_service

router = APIRouter()


@router.get("/projects/{project_id}/scenes", response_model=list[SceneResponse])
async def list_scenes(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await scene_service.get_project_scenes(db, project_id, current_user.id)


@router.post("/projects/{project_id}/scenes", response_model=list[SceneResponse], status_code=201)
async def create_scene(
    project_id: UUID,
    body: SceneCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await scene_service.create_scene(db, project_id, body, current_user.id)


class GenerateScenesResponse(BaseModel):
    scenes: list[SceneResponse]
    project: ProjectResponse


@router.post("/projects/{project_id}/scenes/generate", response_model=GenerateScenesResponse, status_code=201)
async def generate_scenes(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    scenes = await scene_service.generate_scenes(db, project_id, current_user.id)
    project = await project_service.get_project(db, project_id, current_user.id)
    return GenerateScenesResponse(scenes=scenes, project=project)


@router.patch("/scenes/{scene_id}", response_model=SceneResponse)
async def update_scene(
    scene_id: UUID,
    body: SceneUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await scene_service.update_scene(db, scene_id, body, current_user.id)


@router.delete("/scenes/{scene_id}", status_code=204)
async def delete_scene(
    scene_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await scene_service.delete_scene(db, scene_id, current_user.id)


@router.post("/projects/{project_id}/scenes/reorder", response_model=list[SceneResponse])
async def reorder_scenes(
    project_id: UUID,
    body: SceneReorderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await scene_service.reorder_scenes(db, project_id, body.scene_ids, current_user.id)
