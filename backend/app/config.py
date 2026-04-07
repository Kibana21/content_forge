from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/story_studio"
    REDIS_URL: str = "redis://default:7kqABVVfvMLYoFvNSyP3WDgRRT71L43f@redis-10454.c83.us-east-1-2.ec2.cloud.redislabs.com:10454/0"

    # Gemini API key (kept for reference, not used for text generation)
    GEMINI_API_KEY: str = ""
    # Vertex AI text model
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Google Vertex AI (video generation)
    GOOGLE_APPLICATION_CREDENTIALS: str = "../video-key.json"
    GOOGLE_CLOUD_PROJECT: str = "gen-lang-client-0913704662"
    GOOGLE_CLOUD_LOCATION: str = "us-central1"

    # JWT
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # Dev mode bypasses auth — hardcoded dev user for all requests
    DEV_MODE: bool = True

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
