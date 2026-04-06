from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, UUIDMixin, TimestampMixin
import enum


class VideoStatus(str, enum.Enum):
    queued = "queued"
    rendering = "rendering"
    ready = "ready"
    failed = "failed"


class Video(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "videos"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    version_title = Column(String, nullable=False)
    status = Column(String, nullable=False, default=VideoStatus.queued)
    progress_percent = Column(Integer, nullable=False, default=0)
    current_scene = Column(Integer, nullable=False, default=0)
    duration_seconds = Column(Integer, nullable=True)
    file_url = Column(String, nullable=True)
    task_id = Column(String, nullable=True)

    project = relationship("Project", back_populates="videos")
