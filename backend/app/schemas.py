from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="User question")

class ChatResponse(BaseModel):
    conversation_id: int
    answer: str
    category: Optional[str] = None
    verdict: str  # Answered, Refused, Unclear
    response_time_ms: int

class RateRequest(BaseModel):
    rating: Literal["up", "down"]

class RateResponse(BaseModel):
    status: str
    conversation_id: int
    rating: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str

class FAQBase(BaseModel):
    category: str
    keywords: str
    canonical_answer: str

class FAQCreate(FAQBase):
    pass

class FAQUpdate(BaseModel):
    category: Optional[str] = None
    keywords: Optional[str] = None
    canonical_answer: Optional[str] = None

class FAQResponse(FAQBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime

class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question: str
    answer: str
    category: Optional[str] = None
    verdict: str
    response_time_ms: int
    rating: Optional[str] = None
    created_at: datetime

class CategoryVerdictStat(BaseModel):
    category: str
    answered: int = 0
    refused: int = 0
    unclear: int = 0
    total: int = 0

class CategoryResponseTimeStat(BaseModel):
    category: str
    avg_response_time_ms: float
    count: int

class StatsSummary(BaseModel):
    total_conversations: int
    total_answered: int
    total_refused: int
    total_unclear: int
    total_positive: int
    total_negative: int

class StatsResponse(BaseModel):
    summary: StatsSummary
    verdict_by_category: List[CategoryVerdictStat]
    response_time_by_category: List[CategoryResponseTimeStat]
    answered_down_conversations: List[ConversationOut]
    recent_conversations: List[ConversationOut]
