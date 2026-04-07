from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, UUIDMixin


class ScriptVersion(Base, UUIDMixin):
    __tablename__ = "script_versions"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    script = Column(Text, nullable=False)
    word_count = Column(Integer, nullable=True)
    tone = Column(String, nullable=True)
    label = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="script_versions")
