import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ReadLens AI Backend"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite:///./readlens.db"
    
    # LLM Settings
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # Clerk Authentication
    CLERK_SECRET_KEY: Optional[str] = None
    CLERK_JWKS_URL: str = "https://api.clerk.com/v1/jwks"
    
    # Local Development & Testing flags
    MOCK_AUTH: bool = True  # Fallback to verify mock user ID when Clerk keys are missing in local dev
    MOCK_LLM: bool = True   # Fallback to mock LLM responses if API keys are missing
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
