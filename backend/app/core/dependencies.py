import uuid
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.config import settings
from app.models.user import User, UserRole
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token

# Hardcoded dev user ID — consistent across restarts
DEV_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


async def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if settings.DEV_MODE:
        result = await db.execute(select(User).where(User.id == DEV_USER_ID))
        user = result.scalar_one_or_none()
        if user:
            return user
        # Seed dev user if not present
        dev_user = User(
            id=DEV_USER_ID,
            email="dev@storystudio.local",
            name="Dev User",
            role=UserRole.admin,
        )
        db.add(dev_user)
        await db.commit()
        await db.refresh(dev_user)
        return dev_user

    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError()
    token = authorization.split(" ", 1)[1]
    user_id_str = decode_access_token(token)
    if not user_id_str:
        raise UnauthorizedError()
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id_str)))
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedError()
    return user
