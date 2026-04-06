from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, UUIDMixin, TimestampMixin


class Scene(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "scenes"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    sequence_number = Column(Integer, nullable=False)
    name = Column(String, nullable=True)
    dialogue = Column(Text, nullable=True)
    setting = Column(Text, nullable=True)
    camera_framing = Column(String, nullable=True, default="Medium close-up")
    time_start = Column(Integer, nullable=True)  # seconds
    time_end = Column(Integer, nullable=True)    # seconds
    merged_prompt = Column(Text, nullable=True)  # full prompt sent to video API
    storyboard_image_url = Column(String, nullable=True)

    project = relationship("Project", back_populates="scenes")
