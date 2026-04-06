from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, UUIDMixin, TimestampMixin
import enum


class VideoType(str, enum.Enum):
    product_explainer = "product_explainer"
    educational = "educational"
    agent_training = "agent_training"
    social_ad = "social_ad"
    testimonial = "testimonial"
    corporate_update = "corporate_update"
    compliance = "compliance"


class ProjectStatus(str, enum.Enum):
    draft = "draft"
    in_review = "in_review"
    exported = "exported"


class Project(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "projects"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    presenter_id = Column(UUID(as_uuid=True), ForeignKey("presenters.id", ondelete="SET NULL"), nullable=True)

    title = Column(String, nullable=False)
    video_type = Column(String, nullable=True)
    target_audience = Column(String, nullable=True)
    target_duration = Column(Integer, nullable=True)
    key_message = Column(Text, nullable=True)
    brand_kit = Column(String, nullable=True)
    call_to_action = Column(String, nullable=True)

    script = Column(Text, nullable=True)
    tone = Column(String, nullable=True)
    word_count = Column(Integer, nullable=True)

    status = Column(String, nullable=False, default=ProjectStatus.draft)

    user = relationship("User", backref="projects")
    presenter = relationship("Presenter", back_populates="projects")
    scenes = relationship("Scene", back_populates="project", order_by="Scene.sequence_number", cascade="all, delete-orphan")
    videos = relationship("Video", back_populates="project", cascade="all, delete-orphan")
