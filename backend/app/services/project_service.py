from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.project import Project, ProjectStatus
from app.models.scene import Scene
from app.models.video import Video
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectStatsResponse, ExportRequest
from app.core.exceptions import NotFoundError, ForbiddenError


async def _load_project(db: AsyncSession, project_id: UUID) -> Project:
    result = await db.execute(
        select(Project)
        .options(
            selectinload(Project.presenter),
            selectinload(Project.scenes),
            selectinload(Project.videos),
        )
        .where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise NotFoundError("Project not found")
    return project


async def get_user_projects(db: AsyncSession, user_id: UUID) -> list[Project]:
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.presenter), selectinload(Project.scenes), selectinload(Project.videos))
        .where(Project.user_id == user_id)
        .order_by(Project.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_project(db: AsyncSession, project_id: UUID, user_id: UUID) -> Project:
    project = await _load_project(db, project_id)
    if project.user_id != user_id:
        raise ForbiddenError()
    return project


async def create_project(db: AsyncSession, data: ProjectCreate, user_id: UUID) -> Project:
    project = Project(**data.model_dump(), user_id=user_id)
    db.add(project)
    await db.commit()
    return await _load_project(db, project.id)


async def update_project(db: AsyncSession, project_id: UUID, data: ProjectUpdate, user_id: UUID) -> Project:
    project = await get_project(db, project_id, user_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.commit()
    return await _load_project(db, project.id)


async def delete_project(db: AsyncSession, project_id: UUID, user_id: UUID) -> None:
    project = await get_project(db, project_id, user_id)
    await db.delete(project)
    await db.commit()


async def get_stats(db: AsyncSession, user_id: UUID) -> ProjectStatsResponse:
    result = await db.execute(select(Project).where(Project.user_id == user_id))
    projects = list(result.scalars().all())
    project_ids = [p.id for p in projects]

    video_count = 0
    if project_ids:
        vc_result = await db.execute(select(func.count(Video.id)).where(Video.project_id.in_(project_ids)))
        video_count = vc_result.scalar() or 0

    return ProjectStatsResponse(
        total=len(projects),
        drafts=sum(1 for p in projects if p.status == ProjectStatus.draft),
        exported=sum(1 for p in projects if p.status == ProjectStatus.exported),
        in_review=sum(1 for p in projects if p.status == ProjectStatus.in_review),
        videos_generated=video_count,
    )


async def export_project(db: AsyncSession, project_id: UUID, user_id: UUID, req: ExportRequest) -> dict:
    from app.services import version_service
    project = await get_project(db, project_id, user_id)
    scenes = sorted(project.scenes, key=lambda s: s.sequence_number)
    presenter = project.presenter

    if req.format == "script_only":
        result = {
            "format": "script_only",
            "title": project.title,
            "script": project.script,
            "scenes": [
                {"scene": s.sequence_number, "name": s.name, "dialogue": s.dialogue}
                for s in scenes
            ],
        }
        await version_service.save_export_version(db, project_id, user_id, req.format, result)
        return result

    if req.format == "json":
        result = {
            "format": "json",
            "project": {
                "id": str(project.id),
                "title": project.title,
                "video_type": project.video_type,
                "target_audience": project.target_audience,
                "target_duration": project.target_duration,
                "brand_kit": project.brand_kit,
                "call_to_action": project.call_to_action,
            },
            "presenter": {
                "name": presenter.name if presenter else None,
                "full_appearance": presenter.full_appearance if presenter else None,
                "speaking_style": presenter.speaking_style if presenter else None,
            } if presenter else None,
            "scenes": [
                {
                    "sequence_number": s.sequence_number,
                    "name": s.name,
                    "dialogue": s.dialogue,
                    "setting": s.setting,
                    "camera_framing": s.camera_framing,
                    "time_start": s.time_start,
                    "time_end": s.time_end,
                    "merged_prompt": s.merged_prompt,
                }
                for s in scenes
            ],
        }
        await version_service.save_export_version(db, project_id, user_id, req.format, result)
        return result

    # full_package (default)
    result = {
        "format": "full_package",
        "title": project.title,
        "presenter": f"{presenter.name} — {presenter.speaking_style}" if presenter else "No presenter",
        "brand_kit": project.brand_kit,
        "scenes": [
            {
                "scene": s.sequence_number,
                "name": s.name,
                "time": f"{s.time_start or 0}s – {s.time_end or 0}s",
                "dialogue": s.dialogue,
                "setting": s.setting,
                "camera": s.camera_framing,
                "prompt": s.merged_prompt,
            }
            for s in scenes
        ],
    }

    await version_service.save_export_version(db, project_id, user_id, req.format, result)
    return result
