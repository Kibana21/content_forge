from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.scene import Scene
from app.models.project import Project
from app.models.presenter import Presenter
from app.models.script_version import ScriptVersion
from app.schemas.scene import SceneCreate, SceneUpdate
from app.core.exceptions import NotFoundError, ForbiddenError
from app.services import ai_service


def _build_merged_prompt(scene_data: dict, presenter: Presenter | None, brand_kit: str | None) -> str:
    """
    Builds the prompt sent to the video generation API for each scene.
    Must include everything the video AI needs: appearance, delivery style,
    environment, shot type, and the spoken dialogue.
    """
    parts = []
    if scene_data.get("dialogue"):
        parts.append(f"Dialogue: {scene_data['dialogue']}")
    if scene_data.get("setting"):
        parts.append(f"Setting: {scene_data['setting']}")
    if presenter and presenter.full_appearance:
        parts.append(f"Presenter appearance: {presenter.full_appearance}")
    if presenter and presenter.speaking_style:
        parts.append(f"Delivery style: {presenter.speaking_style}")
    if scene_data.get("camera_framing"):
        parts.append(f"Camera: {scene_data['camera_framing']}")
    if brand_kit:
        parts.append(f"Brand: {brand_kit}")
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
    raw_scenes = await ai_service.split_into_scenes(
        script=project.script,
        num_scenes=num_scenes,
        presenter_name=presenter_name,
        speaking_style=presenter.speaking_style if presenter else None,
        brand_kit=project.brand_kit,
        video_type=project.video_type,
        target_audience=project.target_audience,
        tone=project.tone,
    )

    # Delete existing scenes for this project
    existing = await db.execute(select(Scene).where(Scene.project_id == project_id))
    for scene in existing.scalars().all():
        await db.delete(scene)

    # Create new scenes — assign sequence_number from position, never trust AI output
    scenes = []
    for idx, s in enumerate(raw_scenes, start=1):
        merged = _build_merged_prompt(s, presenter, project.brand_kit)
        scene = Scene(
            project_id=project_id,
            sequence_number=idx,
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

    # Stamp which script version these scenes were generated from.
    # If no AI versions exist yet (manually written script), create a snapshot now
    # so there is always a version number to reference.
    latest_version_result = await db.execute(
        select(func.max(ScriptVersion.version_number)).where(ScriptVersion.project_id == project_id)
    )
    latest_version_number = latest_version_result.scalar()

    if latest_version_number is None:
        from app.lib.wordcount import word_count
        snapshot = ScriptVersion(
            project_id=project_id,
            version_number=1,
            script=project.script or "",
            word_count=word_count(project.script or ""),
            label="Snapshot at scene generation",
        )
        db.add(snapshot)
        latest_version_number = 1

    project.storyboard_script_version = latest_version_number

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

    # Rebuild merged_prompt whenever content fields change
    PROMPT_FIELDS = {"dialogue", "setting", "camera_framing"}
    if data.model_dump(exclude_unset=True).keys() & PROMPT_FIELDS:
        presenter = None
        if project.presenter_id:
            p_result = await db.execute(select(Presenter).where(Presenter.id == project.presenter_id))
            presenter = p_result.scalar_one_or_none()
        scene.merged_prompt = _build_merged_prompt(
            {"dialogue": scene.dialogue, "setting": scene.setting, "camera_framing": scene.camera_framing},
            presenter,
            project.brand_kit,
        )

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


async def create_scene(db: AsyncSession, project_id: UUID, data: SceneCreate, user_id: UUID) -> list[Scene]:
    """Insert a new blank scene after insert_after_sequence, then renumber all scenes."""
    proj = await db.execute(select(Project).where(Project.id == project_id))
    project = proj.scalar_one_or_none()
    if not project:
        raise NotFoundError("Project not found")
    if project.user_id != user_id:
        raise ForbiddenError()

    # Load existing scenes ordered
    existing = await get_project_scenes(db, project_id, user_id)

    insert_after = data.insert_after_sequence or len(existing)

    # Shift sequence numbers up for scenes after insertion point
    for scene in existing:
        if scene.sequence_number > insert_after:
            scene.sequence_number += 1

    new_scene = Scene(
        project_id=project_id,
        sequence_number=insert_after + 1,
        name=data.name or f"Scene {insert_after + 1}",
        dialogue=data.dialogue or "",
        setting=data.setting or "",
        camera_framing=data.camera_framing or "Medium close-up",
    )
    db.add(new_scene)
    await db.commit()
    return await get_project_scenes(db, project_id, user_id)


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
