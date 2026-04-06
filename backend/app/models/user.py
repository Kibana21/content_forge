from sqlalchemy import Column, String
from app.models.base import Base, UUIDMixin, TimestampMixin
import enum


class UserRole(str, enum.Enum):
    creator = "creator"
    reviewer = "reviewer"
    admin = "admin"


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True)
    role = Column(String, nullable=False, default=UserRole.creator)
