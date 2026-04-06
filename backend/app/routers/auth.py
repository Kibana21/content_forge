from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: Optional[str]
    picture: Optional[str]
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class GoogleTokenRequest(BaseModel):
    id_token: str


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/google")
async def google_login(body: GoogleTokenRequest):
    # Stub — returns a fake token in dev mode
    return {"access_token": "dev-token", "token_type": "bearer"}


@router.post("/logout")
async def logout():
    return {"message": "Logged out"}
