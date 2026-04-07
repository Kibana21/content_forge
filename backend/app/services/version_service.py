import json as _json
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.script_version import ScriptVersion
from app.models.project_export import ProjectExport
from app.models.project import Project
from app.core.exceptions import NotFoundError, ForbiddenError


async def _check_project(db: AsyncSession, project_id: UUID, user_id: UUID) -> Project:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise NotFoundError("Project not found")
    if project.user_id != user_id:
        raise ForbiddenError()
    return project


async def _next_script_version(db: AsyncSession, project_id: UUID) -> int:
    result = await db.execute(
        select(func.max(ScriptVersion.version_number)).where(ScriptVersion.project_id == project_id)
    )
    current_max = result.scalar() or 0
    return current_max + 1


async def _next_export_version(db: AsyncSession, project_id: UUID) -> int:
    result = await db.execute(
        select(func.max(ProjectExport.version_number)).where(ProjectExport.project_id == project_id)
    )
    current_max = result.scalar() or 0
    return current_max + 1


async def save_script_version(
    db: AsyncSession,
    project_id: UUID,
    user_id: UUID,
    script: str,
    word_count: int | None,
    tone: str | None,
    label: str,
) -> ScriptVersion:
    await _check_project(db, project_id, user_id)
    version_number = await _next_script_version(db, project_id)
    version = ScriptVersion(
        project_id=project_id,
        version_number=version_number,
        script=script,
        word_count=word_count,
        tone=tone,
        label=label,
    )
    db.add(version)
    await db.commit()
    await db.refresh(version)
    return version


async def list_script_versions(db: AsyncSession, project_id: UUID, user_id: UUID) -> list[ScriptVersion]:
    await _check_project(db, project_id, user_id)
    result = await db.execute(
        select(ScriptVersion)
        .where(ScriptVersion.project_id == project_id)
        .order_by(ScriptVersion.version_number.desc())
    )
    return list(result.scalars().all())


async def save_export_version(
    db: AsyncSession,
    project_id: UUID,
    user_id: UUID,
    format: str,
    export_data: dict,
) -> ProjectExport:
    project = await _check_project(db, project_id, user_id)
    version_number = await _next_export_version(db, project_id)
    export = ProjectExport(
        project_id=project_id,
        version_number=version_number,
        format=format,
        export_json=_json.dumps(export_data),
    )
    db.add(export)
    project.status = "exported"
    await db.commit()
    await db.refresh(export)
    return export


async def list_export_versions(db: AsyncSession, project_id: UUID, user_id: UUID) -> list[ProjectExport]:
    await _check_project(db, project_id, user_id)
    result = await db.execute(
        select(ProjectExport)
        .where(ProjectExport.project_id == project_id)
        .order_by(ProjectExport.version_number.desc())
    )
    return list(result.scalars().all())
