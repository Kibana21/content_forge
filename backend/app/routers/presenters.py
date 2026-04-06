from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.presenter import PresenterCreate, PresenterUpdate, PresenterResponse
from app.services import presenter_service

router = APIRouter()


@router.get("", response_model=list[PresenterResponse])
async def list_presenters(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await presenter_service.get_user_presenters(db, current_user.id)


@router.post("", response_model=PresenterResponse, status_code=201)
async def create_presenter(
    body: PresenterCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await presenter_service.create_presenter(db, body, current_user.id)


@router.get("/{presenter_id}", response_model=PresenterResponse)
async def get_presenter(
    presenter_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await presenter_service.get_presenter(db, presenter_id, current_user.id)


@router.patch("/{presenter_id}", response_model=PresenterResponse)
async def update_presenter(
    presenter_id: UUID,
    body: PresenterUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await presenter_service.update_presenter(db, presenter_id, body, current_user.id)


@router.delete("/{presenter_id}", status_code=204)
async def delete_presenter(
    presenter_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await presenter_service.delete_presenter(db, presenter_id, current_user.id)
