import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import FAQEntry, Conversation
from backend.app.schemas import ChatRequest, ChatResponse, RateRequest, RateResponse
from backend.app.matcher import faq_matcher

router = APIRouter(tags=["Chat"])

@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
def handle_chat(payload: ChatRequest, db: Session = Depends(get_db)):
    question_text = payload.question.strip()
    if not question_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty or blank."
        )

    start_time = time.perf_counter()

    # Retrieve all current FAQ entries from database
    faqs = db.query(FAQEntry).all()

    # Execute matching algorithm
    match_result = faq_matcher.match(question_text, faqs)

    elapsed_ms = max(1, int((time.perf_counter() - start_time) * 1000))

    # Persist conversation to the database
    conversation = Conversation(
        question=question_text,
        answer=match_result.answer,
        category=match_result.category,
        verdict=match_result.verdict,
        response_time_ms=elapsed_ms,
        rating=None
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return ChatResponse(
        conversation_id=conversation.id,
        answer=conversation.answer,
        category=conversation.category,
        verdict=conversation.verdict,
        response_time_ms=conversation.response_time_ms
    )

@router.post("/chat/{id}/rate", response_model=RateResponse, status_code=status.HTTP_200_OK)
def rate_conversation(id: int, payload: RateRequest, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == id).first()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with id {id} not found."
        )

    if payload.rating not in ("up", "down"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be either 'up' or 'down'."
        )

    conversation.rating = payload.rating
    db.commit()
    db.refresh(conversation)

    return RateResponse(
        status="success",
        conversation_id=conversation.id,
        rating=conversation.rating
    )
