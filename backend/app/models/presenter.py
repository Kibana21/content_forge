from sqlalchemy import Column, String, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, UUIDMixin, TimestampMixin
import enum


class SpeakingStyle(str, enum.Enum):
    warm_reassuring = "warm_reassuring"
    confident_authoritative = "confident_authoritative"
    energetic_motivational = "energetic_motivational"
    calm_educational = "calm_educational"


class Presenter(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "presenters"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    age_range = Column(String, nullable=True)
    appearance_keywords = Column(String, nullable=True)
    speaking_style = Column(String, nullable=True)
    full_appearance = Column(Text, nullable=True)
    is_template = Column(Boolean, default=False, nullable=False)

    user = relationship("User", backref="presenters")
    projects = relationship("Project", back_populates="presenter")
