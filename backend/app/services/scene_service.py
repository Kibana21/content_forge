from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.scene import Scene
from app.models.project import Project
from app.models.presenter import Presenter
from app.schemas.scene import SceneUpdate
from app.core.exceptions import NotFoundError, ForbiddenError
from app.services import ai_service


def _build_merged_prompt(scene_data: dict, presenter: Presenter | None, brand_kit: str | None) -> str:
    parts = []
    if scene_data.get("dialogue"):
        parts.append(scene_data["dialogue"])
    if scene_data.get("setting"):
        parts.append(f"\nSetting: {scene_data['setting']}")
    if presenter and presenter.full_appearance:
        parts.append(f"\nPresenter: {presenter.full_appearance}")
    if brand_kit:
        parts.append(f"\nBrand kit: {brand_kit}")
    return "\n".join(parts)


async def get_project_scenes(db: AsyncSession, project_id: UUID, user_id: UUID) -> list[Scene]:
    # verify project ownership
    proj = await db.execute(select(Project).where(Project.id == project_id))
    project = proj.scalar_one_or_none()
    if not project:
        raise NotFoundError("Project not found")
    if project.user_id != user_id:
        raise ForbiddenError()

    result = await db.execute(
        select(Scene).where(Scene.project_id == project_id).order_by(Scene.sequence_number)
    )
    return list(result.scalars().all())


async def generate_scenes(db: AsyncSession, project_id: UUID, user_id: UUID) -> list[Scene]:
    proj_result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        raise NotFoundError("Project not found")
    if project.user_id != user_id:
        raise ForbiddenError()
    if not project.script:
        raise ValueError("Project has no script to split")

    # Determine number of scenes from target_duration
    duration_to_scenes = {15: 2, 30: 3, 60: 5, 90: 7}
    num_scenes = duration_to_scenes.get(project.target_duration or 60, 5)

    # Load presenter if set
    presenter = None
    if project.presenter_id:
        p_result = await db.execute(select(Presenter).where(Presenter.id == project.presenter_id))
        presenter = p_result.scalar_one_or_none()

    presenter_name = presenter.name.split(" - ")[0] if presenter else "Presenter"
    raw_scenes = await ai_service.split_into_scenes(project.script, num_scenes, presenter_name)

    # Delete existing scenes for this project
    existing = await db.execute(select(Scene).where(Scene.project_id == project_id))
    for scene in existing.scalars().all():
        await db.delete(scene)

    # Create new scenes
    scenes = []
    for s in raw_scenes:
        merged = _build_merged_prompt(s, presenter, project.brand_kit)
        scene = Scene(
            project_id=project_id,
            sequence_number=s.get("sequence_number", len(scenes) + 1),
            name=s.get("name"),
            dialogue=s.get("dialogue"),
            setting=s.get("setting"),
            camera_framing=s.get("camera_framing", "Medium close-up"),
            time_start=s.get("time_start"),
            time_end=s.get("time_end"),
            merged_prompt=merged,
        )
        db.add(scene)
        scenes.append(scene)

    await db.commit()
    for scene in scenes:
        await db.refresh(scene)
    return scenes


async def update_scene(db: AsyncSession, scene_id: UUID, data: SceneUpdate, user_id: UUID) -> Scene:
    result = await db.execute(
        select(Scene).where(Scene.id == scene_id)
    )
    scene = result.scalar_one_or_none()
    if not scene:
        raise NotFoundError("Scene not found")

    # Check project ownership
    proj = await db.execute(select(Project).where(Project.id == scene.project_id))
    project = proj.scalar_one_or_none()
    if not project or project.user_id != user_id:
        raise ForbiddenError()

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(scene, field, value)
    await db.commit()
    await db.refresh(scene)
    return scene


async def delete_scene(db: AsyncSession, scene_id: UUID, user_id: UUID) -> None:
    result = await db.execute(select(Scene).where(Scene.id == scene_id))
    scene = result.scalar_one_or_none()
    if not scene:
        raise NotFoundError("Scene not found")
    proj = await db.execute(select(Project).where(Project.id == scene.project_id))
    project = proj.scalar_one_or_none()
    if not project or project.user_id != user_id:
        raise ForbiddenError()
    await db.delete(scene)
    await db.commit()


async def reorder_scenes(db: AsyncSession, project_id: UUID, scene_ids: list[UUID], user_id: UUID) -> list[Scene]:
    proj = await db.execute(select(Project).where(Project.id == project_id))
    project = proj.scalar_one_or_none()
    if not project or project.user_id != user_id:
        raise ForbiddenError()

    for idx, scene_id in enumerate(scene_ids, start=1):
        result = await db.execute(select(Scene).where(Scene.id == scene_id, Scene.project_id == project_id))
        scene = result.scalar_one_or_none()
        if scene:
            scene.sequence_number = idx
    await db.commit()
    return await get_project_scenes(db, project_id, user_id)
