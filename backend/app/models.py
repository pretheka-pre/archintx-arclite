from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from backend.app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class FAQEntry(Base):
    __tablename__ = "faq_entries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category = Column(String(50), nullable=False, index=True)
    keywords = Column(Text, nullable=False)
    canonical_answer = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String(50), nullable=True, index=True)
    verdict = Column(String(20), nullable=False, index=True)  # Answered, Refused, Unclear
    response_time_ms = Column(Integer, nullable=False, default=0)
    rating = Column(String(10), nullable=True, index=True)  # 'up', 'down', or None
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
