from google import genai
from app.config import settings

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
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
    prompt = (
        f"You are writing a video script for a {brief.get('video_type', 'corporate')} video.\n"
        f"Target audience: {brief.get('target_audience', 'general audience')}\n"
        f"Key message: {brief.get('key_message', '')}\n"
        f"Brand/tone: {brief.get('brand_kit', 'professional')}\n"
        f"Target duration: {duration_label}\n"
        f"Call to action: {brief.get('call_to_action', '')}\n\n"
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
    tone_instructions = {
        "warm_personal": "Rewrite this script to feel warmer and more personal — like talking to a friend.",
        "more_professional": "Rewrite this script to sound more professional and authoritative, while remaining approachable.",
        "shorter": "Rewrite this script to be significantly shorter — cut unnecessary words, keep the core message and CTA.",
        "stronger_cta": "Rewrite this script with a stronger, more compelling call to action at the end.",
    }
    instruction = tone_instructions.get(tone, f"Rewrite this script with a {tone} tone.")
    prompt = f"{instruction}\n\nOriginal script:\n{script}\n\nRewritten script:"
    client = _get_client()
    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
    )
    return response.text.strip()


async def split_into_scenes(script: str, num_scenes: int, presenter_name: str = "Presenter") -> list[dict]:
    prompt = (
        f"Split this video script into exactly {num_scenes} scenes.\n"
        f"The presenter is called {presenter_name}.\n\n"
        f"Return a JSON array where each element has these fields:\n"
        f"  - sequence_number (1-based integer)\n"
        f"  - name (short scene name like 'The Hook', 'The Why', 'Call to Action')\n"
        f"  - dialogue (the portion of script for this scene)\n"
        f"  - setting (vivid description of the environment and {presenter_name}'s action/pose, 1-2 sentences)\n"
        f"  - camera_framing (one of: 'Medium close-up', 'Wide shot', 'Close-up', 'Tracking shot')\n"
        f"  - time_start (estimated start in seconds, integer)\n"
        f"  - time_end (estimated end in seconds, integer)\n\n"
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
