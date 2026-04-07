from google import genai
from google.genai.types import HttpOptions
from google.oauth2 import service_account
from app.config import settings

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        credentials = service_account.Credentials.from_service_account_file(
            settings.GOOGLE_APPLICATION_CREDENTIALS,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        _client = genai.Client(
            vertexai=True,
            project=settings.GOOGLE_CLOUD_PROJECT,
            location=settings.GOOGLE_CLOUD_LOCATION,
            credentials=credentials,
            http_options=HttpOptions(api_version="v1"),
        )
    return _client


async def generate_appearance(keywords: str) -> str:
    prompt = (
        f"You are helping create a consistent AI video presenter description.\n"
        f"Based on these appearance keywords: \"{keywords}\"\n"
        f"Write a detailed, vivid appearance description (3-5 sentences) that will be used "
        f"to keep this presenter looking identical across every video scene.\n"
        f"Focus on: hair, face, clothing, accessories, posture and demeanor.\n"
        f"Write in third person, present tense. Be specific and visual."
    )
    client = _get_client()
    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
    )
    return response.text.strip()


async def draft_script(brief: dict) -> str:
    duration_label = {15: "15 seconds", 30: "30 seconds", 60: "60 seconds", 90: "90 seconds"}.get(
        brief.get("target_duration", 60), f"{brief.get('target_duration', 60)} seconds"
    )

    # Build tone instruction from user preferences (comma-separated preset keys + custom text)
    preset_tone_labels = {
        "warm_personal": "warm and personal — like talking to a friend",
        "more_professional": "professional and authoritative, while remaining approachable",
        "shorter": "concise — no unnecessary words",
        "stronger_cta": "with a strong, compelling call to action",
    }
    tone_parts = [t.strip() for t in (brief.get("tone") or "").split(",") if t.strip()]
    tone_descriptions = [preset_tone_labels.get(t, t) for t in tone_parts]
    tone_line = f"Style: {', and '.join(tone_descriptions)}.\n" if tone_descriptions else ""

    prompt = (
        f"You are writing a video script for a {brief.get('video_type', 'corporate')} video.\n"
        f"Target audience: {brief.get('target_audience', 'general audience')}\n"
        f"Key message: {brief.get('key_message', '')}\n"
        f"Brand/tone: {brief.get('brand_kit', 'professional')}\n"
        f"Target duration: {duration_label}\n"
        f"Call to action: {brief.get('call_to_action', '')}\n"
        f"{tone_line}\n"
        f"Write a natural, engaging script. Use plain conversational language. No jargon.\n"
        f"Do not include scene directions or stage notes — just the spoken words.\n"
        f"End with a clear, warm call to action."
    )
    client = _get_client()
    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
    )
    return response.text.strip()


async def rewrite_script(script: str, tone: str) -> str:
    preset_instructions = {
        "warm_personal": "feel warmer and more personal — like talking to a friend",
        "more_professional": "sound more professional and authoritative, while remaining approachable",
        "shorter": "be significantly shorter — cut unnecessary words, keep the core message and CTA",
        "stronger_cta": "have a stronger, more compelling call to action at the end",
    }
    # tone may be a comma-separated list of preset keys and/or custom text
    parts = [t.strip() for t in tone.split(",") if t.strip()]
    instructions = []
    for part in parts:
        if part in preset_instructions:
            instructions.append(preset_instructions[part])
        else:
            instructions.append(part)
    if instructions:
        instruction = "Rewrite this script to " + ", and ".join(instructions) + "."
    else:
        instruction = "Rewrite this script with a better tone."
    prompt = f"{instruction}\n\nOriginal script:\n{script}\n\nRewritten script:"
    client = _get_client()
    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
    )
    return response.text.strip()


async def split_into_scenes(
    script: str,
    num_scenes: int,
    presenter_name: str = "Presenter",
    speaking_style: str | None = None,
    brand_kit: str | None = None,
    video_type: str | None = None,
    target_audience: str | None = None,
    tone: str | None = None,
) -> list[dict]:

    # Camera guidance based on video type
    camera_guidance = {
        "social_ad": "favour Close-up and Medium close-up for punchy, high-energy cuts",
        "agent_training": "favour Wide shot and Medium close-up for clear, composed instruction",
        "educational": "favour Medium close-up and Wide shot, vary to maintain attention",
        "product_explainer": "favour Medium close-up; use Wide shot when showing environment or product context",
        "testimonial": "favour Close-up and Medium close-up to feel personal and direct",
        "corporate_update": "favour Medium close-up and Wide shot for authority and clarity",
        "compliance": "favour Medium close-up for seriousness; avoid overly dynamic shots",
    }.get(video_type or "", "choose the most appropriate framing for each moment")

    # Presenter delivery context
    style_line = f"Speaking style: {speaking_style}. Reflect this in how you describe {presenter_name}'s body language, energy, and delivery in the setting field.\n" if speaking_style else ""
    brand_line = f"Brand environment: {brand_kit}. The setting should feel consistent with this brand aesthetic.\n" if brand_kit else ""
    audience_line = f"Target audience: {target_audience}. Keep dialogue pacing and complexity appropriate for them.\n" if target_audience else ""
    tone_line = f"Tone/style: {tone}. The scenes should reinforce this emotional register.\n" if tone else ""

    prompt = (
        f"You are a professional video director breaking a script into {num_scenes} scenes.\n"
        f"The presenter is called {presenter_name}.\n"
        f"{style_line}"
        f"{brand_line}"
        f"{audience_line}"
        f"{tone_line}"
        f"Camera framing guidance: {camera_guidance}.\n\n"
        f"Return a JSON array where each element has these fields:\n"
        f"  - sequence_number (1-based integer)\n"
        f"  - name (short evocative scene name, e.g. 'The Hook', 'The Why', 'Call to Action')\n"
        f"  - dialogue (the exact portion of script spoken in this scene)\n"
        f"  - setting (1-2 vivid sentences: describe the environment AND {presenter_name}'s specific action, pose, and delivery energy — informed by their speaking style)\n"
        f"  - camera_framing (one of: 'Medium close-up', 'Wide shot', 'Close-up', 'Tracking shot', 'Over-the-shoulder')\n"
        f"  - time_start (estimated start time in seconds, integer)\n"
        f"  - time_end (estimated end time in seconds, integer)\n\n"
        f"Return ONLY valid JSON — no markdown, no explanation.\n\n"
        f"Script:\n{script}"
    )
    client = _get_client()
    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
    )
    import json
    text = response.text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.rsplit("```", 1)[0]
    return json.loads(text.strip())
