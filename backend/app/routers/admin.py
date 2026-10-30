from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models import FAQEntry, Conversation, Staff
from backend.app.schemas import (
    FAQCreate, FAQUpdate, FAQResponse, StatsResponse, StatsSummary,
    CategoryVerdictStat, CategoryResponseTimeStat, ConversationOut
)
from backend.app.auth import get_current_staff

router = APIRouter(prefix="/admin", tags=["Admin FAQ & Analytics"])

ALLOWED_CATEGORIES = ["Courses", "Certificates", "Jobs", "Account"]

# ==================== FAQ MANAGEMENT ====================

@router.get("/faq", response_model=List[FAQResponse])
def list_faqs(
    search: Optional[str] = Query(None, description="Search keywords or answer"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_staff: Staff = Depends(get_current_staff)
):
    query = db.query(FAQEntry)

    if category and category.strip():
        query = query.filter(func.lower(FAQEntry.category) == category.strip().lower())

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(FAQEntry.keywords).like(term) |
            func.lower(FAQEntry.canonical_answer).like(term) |
            func.lower(FAQEntry.category).like(term)
        )

    return query.order_by(FAQEntry.id.desc()).all()

@router.post("/faq", response_model=FAQResponse, status_code=status.HTTP_201_CREATED)
def create_faq(
    payload: FAQCreate,
    db: Session = Depends(get_db),
    current_staff: Staff = Depends(get_current_staff)
):
    category = payload.category.strip().capitalize()
    keywords = payload.keywords.strip()
    answer = payload.canonical_answer.strip()

    if not category or not keywords or not answer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category, trigger keywords, and canonical answer are all required."
        )

    # Normalize category capitalization if matched in standard set
    for allowed in ALLOWED_CATEGORIES:
        if category.lower() == allowed.lower():
            category = allowed
            break

    faq = FAQEntry(
        category=category,
        keywords=keywords,
        canonical_answer=answer,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq

@router.put("/faq/{id}", response_model=FAQResponse)
def update_faq(
    id: int,
    payload: FAQUpdate,
    db: Session = Depends(get_db),
    current_staff: Staff = Depends(get_current_staff)
):
    faq = db.query(FAQEntry).filter(FAQEntry.id == id).first()
    if not faq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FAQ with id {id} not found."
        )

    if payload.category is not None:
        cat = payload.category.strip()
        if not cat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category cannot be empty.")
        for allowed in ALLOWED_CATEGORIES:
            if cat.lower() == allowed.lower():
                cat = allowed
                break
        faq.category = cat

    if payload.keywords is not None:
        kw = payload.keywords.strip()
        if not kw:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Keywords cannot be empty.")
        faq.keywords = kw

    if payload.canonical_answer is not None:
        ans = payload.canonical_answer.strip()
        if not ans:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Answer cannot be empty.")
        faq.canonical_answer = ans

    faq.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(faq)
    return faq

@router.delete("/faq/{id}", status_code=status.HTTP_200_OK)
def delete_faq(
    id: int,
    db: Session = Depends(get_db),
    current_staff: Staff = Depends(get_current_staff)
):
    faq = db.query(FAQEntry).filter(FAQEntry.id == id).first()
    if not faq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FAQ with id {id} not found."
        )

    db.delete(faq)
    db.commit()
    return {"status": "success", "message": f"FAQ with id {id} deleted successfully."}

# ==================== ANALYTICS STATS ====================

@router.get("/stats", response_model=StatsResponse)
def get_analytics_stats(
    db: Session = Depends(get_db),
    current_staff: Staff = Depends(get_current_staff)
):
    # Dynamic calculations from actual DB conversation records
    total_conversations = db.query(Conversation).count()
    total_answered = db.query(Conversation).filter(Conversation.verdict == "Answered").count()
    total_refused = db.query(Conversation).filter(Conversation.verdict == "Refused").count()
    total_unclear = db.query(Conversation).filter(Conversation.verdict == "Unclear").count()
    total_positive = db.query(Conversation).filter(Conversation.rating == "up").count()
    total_negative = db.query(Conversation).filter(Conversation.rating == "down").count()

    summary = StatsSummary(
        total_conversations=total_conversations,
        total_answered=total_answered,
        total_refused=total_refused,
        total_unclear=total_unclear,
        total_positive=total_positive,
        total_negative=total_negative
    )

    # 1. Verdict distribution by category
    categories = ALLOWED_CATEGORIES + ["Uncategorized"]
    verdict_by_category: List[CategoryVerdictStat] = []

    for cat in categories:
        if cat == "Uncategorized":
            cat_query = db.query(Conversation).filter(
                (Conversation.category.is_(None)) | (~Conversation.category.in_(ALLOWED_CATEGORIES))
            )
        else:
            cat_query = db.query(Conversation).filter(Conversation.category == cat)

        ans_count = cat_query.filter(Conversation.verdict == "Answered").count()
        ref_count = cat_query.filter(Conversation.verdict == "Refused").count()
        unc_count = cat_query.filter(Conversation.verdict == "Unclear").count()
        total_cat = ans_count + ref_count + unc_count

        verdict_by_category.append(
            CategoryVerdictStat(
                category=cat,
                answered=ans_count,
                refused=ref_count,
                unclear=unc_count,
                total=total_cat
            )
        )

    # 2. Average response time by category
    response_time_by_category: List[CategoryResponseTimeStat] = []
    for cat in ALLOWED_CATEGORIES:
        stats = db.query(
            func.avg(Conversation.response_time_ms).label("avg_time"),
            func.count(Conversation.id).label("count")
        ).filter(Conversation.category == cat).first()

        avg_time = float(stats.avg_time) if stats and stats.avg_time is not None else 0.0
        count = int(stats.count) if stats and stats.count is not None else 0

        response_time_by_category.append(
            CategoryResponseTimeStat(
                category=cat,
                avg_response_time_ms=round(avg_time, 2),
                count=count
            )
        )

    # 3. Answered conversations receiving thumbs-down feedback
    answered_down = db.query(Conversation).filter(
        Conversation.verdict == "Answered",
        Conversation.rating == "down"
    ).order_by(Conversation.created_at.desc()).all()

    # Recent conversations
    recent = db.query(Conversation).order_by(Conversation.created_at.desc()).limit(100).all()

    return StatsResponse(
        summary=summary,
        verdict_by_category=verdict_by_category,
        response_time_by_category=response_time_by_category,
        answered_down_conversations=[ConversationOut.model_validate(c) for c in answered_down],
        recent_conversations=[ConversationOut.model_validate(c) for c in recent]
    )
