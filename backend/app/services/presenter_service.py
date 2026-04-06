from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.presenter import Presenter
from app.schemas.presenter import PresenterCreate, PresenterUpdate
from app.core.exceptions import NotFoundError, ForbiddenError


async def get_user_presenters(db: AsyncSession, user_id: UUID) -> list[Presenter]:
    result = await db.execute(
        select(Presenter).where(Presenter.user_id == user_id).order_by(Presenter.created_at.desc())
    )
    return list(result.scalars().all())


async def get_presenter(db: AsyncSession, presenter_id: UUID, user_id: UUID) -> Presenter:
    result = await db.execute(select(Presenter).where(Presenter.id == presenter_id))
    presenter = result.scalar_one_or_none()
    if not presenter:
        raise NotFoundError("Presenter not found")
    if presenter.user_id != user_id:
        raise ForbiddenError()
    return presenter


async def create_presenter(db: AsyncSession, data: PresenterCreate, user_id: UUID) -> Presenter:
    presenter = Presenter(**data.model_dump(), user_id=user_id)
    db.add(presenter)
    await db.commit()
    await db.refresh(presenter)
    return presenter


async def update_presenter(db: AsyncSession, presenter_id: UUID, data: PresenterUpdate, user_id: UUID) -> Presenter:
    presenter = await get_presenter(db, presenter_id, user_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(presenter, field, value)
    await db.commit()
    await db.refresh(presenter)
    return presenter


async def delete_presenter(db: AsyncSession, presenter_id: UUID, user_id: UUID) -> None:
    presenter = await get_presenter(db, presenter_id, user_id)
    await db.delete(presenter)
    await db.commit()
