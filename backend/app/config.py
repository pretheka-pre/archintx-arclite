import os
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="allow", env_file=".env")

    PROJECT_NAME: str = "Arc Lite"
    COMPANY_NAME: str = "ArchintX"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./arclite.db")
    
    # Security & Auth
    JWT_SECRET_KEY: str = Field(min_length=32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Default Staff Seed
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@archintx.com")
    ADMIN_PASSWORD: str = Field(min_length=12)
    
    # Matching Engine Parameters
    # High confidence: above this threshold and unambiguous -> Answered
    HIGH_CONFIDENCE_THRESHOLD: float = float(os.getenv("HIGH_CONFIDENCE_THRESHOLD", "0.22"))
    # Low confidence: between LOW and HIGH -> Unclear; below LOW -> Refused
    LOW_CONFIDENCE_THRESHOLD: float = float(os.getenv("LOW_CONFIDENCE_THRESHOLD", "0.08"))
    # Ambiguity margin: if difference between top 2 scores is <= margin -> Unclear
    # Only fires when BOTH top results are from DIFFERENT categories.
    # Lower = more decisive (recommended: 0.02)
    AMBIGUITY_MARGIN: float = float(os.getenv("AMBIGUITY_MARGIN", "0.02"))
    
    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "*")
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000")

# Pydantic resolves required settings from environment variables and .env.
settings = Settings()  # pyright: ignore[reportCallIssue]
