import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models import Staff, FAQEntry, Conversation
from backend.app.seed import seed_database
from backend.app.config import settings

# Setup isolated test SQLite database
TEST_DB_URL = "sqlite:///./test_arclite.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_arclite.db"):
        try:
            os.remove("./test_arclite.db")
        except Exception:
            pass

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def auth_header(client):
    response = client.post(
        "/auth/login",
        json={"email": settings.ADMIN_EMAIL, "password": settings.ADMIN_PASSWORD}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# ==================== TESTS ====================

def test_successful_faq_matching(client):
    """Test that a relevant question confidently matches the canonical FAQ."""
    response = client.post("/chat", json={"question": "How can I enroll in a course?"})
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "Answered"
    assert data["category"] == "Courses"
    assert "Course Catalog" in data["answer"]
    assert data["response_time_ms"] > 0
    assert "conversation_id" in data

def test_unrelated_question_refusal(client):
    """Test that completely out-of-scope questions are refused with no hallucination."""
    response = client.post("/chat", json={"question": "What is the capital of Japan?"})
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "Refused"
    assert "verified information" in data["answer"]
    assert data["category"] is None

def test_anti_hallucination_guarantee(client):
    """Verify that a variety of general-knowledge/hallucination bait questions are strictly refused."""
    bait_questions = [
        "What is the stock price of ArchintX on NASDAQ?",
        "How do black holes form in outer space?",
        "Give me a recipe for chocolate cake with strawberry frosting.",
        "Who was the 16th president of the United States?",
        "Write a poem about quantum mechanics."
    ]
    for q in bait_questions:
        res = client.post("/chat", json={"question": q})
        assert res.status_code == 200
        data = res.json()
        assert data["verdict"] == "Refused", f"Expected Refused for '{q}', got {data['verdict']}"
        assert "verified information" in data["answer"]

def test_ambiguous_question_handling(client):
    """Test that vague or multi-faceted questions return an Unclear verdict as per specification."""
    response = client.post("/chat", json={"question": "Tell me about your programs."})
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "Unclear"
    assert "ambiguous" in data["answer"].lower() or "clarify" in data["answer"].lower()

def test_missing_input_validation(client):
    """Test that empty or blank input is rejected with HTTP 400."""
    res_empty = client.post("/chat", json={"question": "   "})
    assert res_empty.status_code == 400

    res_missing = client.post("/chat", json={})
    assert res_missing.status_code == 422

def test_conversation_logging(client):
    """Test that conversations are persisted in the database with timestamps and latency."""
    res = client.post("/chat", json={"question": "How do I reset my account password?"})
    assert res.status_code == 200
    cid = res.json()["conversation_id"]

    db = TestingSessionLocal()
    conv = db.query(Conversation).filter(Conversation.id == cid).first()
    db.close()

    assert conv is not None
    assert conv.question == "How do I reset my account password?"
    assert conv.verdict == "Answered"
    assert conv.category == "Account"

def test_thumbs_up_feedback(client):
    """Test submitting thumbs-up feedback for a logged conversation."""
    res = client.post("/chat", json={"question": "How can I verify an ArchintX certificate?"})
    cid = res.json()["conversation_id"]

    rate_res = client.post(f"/chat/{cid}/rate", json={"rating": "up"})
    assert rate_res.status_code == 200
    assert rate_res.json()["status"] == "success"
    assert rate_res.json()["rating"] == "up"

    db = TestingSessionLocal()
    conv = db.query(Conversation).filter(Conversation.id == cid).first()
    db.close()
    assert conv.rating == "up"

def test_thumbs_down_feedback(client):
    """Test submitting thumbs-down feedback for a logged conversation."""
    res = client.post("/chat", json={"question": "Does ArchintX have internship opportunities?"})
    cid = res.json()["conversation_id"]

    rate_res = client.post(f"/chat/{cid}/rate", json={"rating": "down"})
    assert rate_res.status_code == 200
    assert rate_res.json()["status"] == "success"
    assert rate_res.json()["rating"] == "down"

    db = TestingSessionLocal()
    conv = db.query(Conversation).filter(Conversation.id == cid).first()
    db.close()
    assert conv.rating == "down"

def test_staff_authentication_success(client):
    """Test that valid staff credentials return a JWT token."""
    res = client.post(
        "/auth/login",
        json={"email": settings.ADMIN_EMAIL, "password": settings.ADMIN_PASSWORD}
    )
    assert res.status_code == 200
    body = res.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert body["email"] == settings.ADMIN_EMAIL.lower()

def test_staff_authentication_invalid_credentials(client):
    """Test that invalid credentials return 401 Unauthorized."""
    res = client.post(
        "/auth/login",
        json={"email": settings.ADMIN_EMAIL, "password": "WrongPassword123!"}
    )
    assert res.status_code == 401

def test_unauthorized_admin_access(client):
    """Test that protected admin endpoints reject unauthenticated requests."""
    res_faq = client.get("/admin/faq")
    assert res_faq.status_code == 401

    res_stats = client.get("/admin/stats")
    assert res_stats.status_code == 401

def test_faq_creation_and_editing(client, auth_header):
    """Test that authorized staff can create, read, update, and delete FAQs."""
    # Create new FAQ
    new_faq_payload = {
        "category": "Jobs",
        "keywords": "remote working policy work from anywhere home flexibility",
        "canonical_answer": "ArchintX supports flexible 100% remote work arrangements for qualifying technical roles."
    }
    create_res = client.post("/admin/faq", json=new_faq_payload, headers=auth_header)
    assert create_res.status_code == 201
    created_faq = create_res.json()
    faq_id = created_faq["id"]
    assert created_faq["category"] == "Jobs"

    # Update FAQ
    update_payload = {
        "canonical_answer": "ArchintX supports 100% remote work across all global developer positions."
    }
    update_res = client.put(f"/admin/faq/{faq_id}", json=update_payload, headers=auth_header)
    assert update_res.status_code == 200
    assert update_res.json()["canonical_answer"] == update_payload["canonical_answer"]

    # Immediate matching test with updated FAQ
    match_res = client.post("/chat", json={"question": "What is the remote working policy?"})
    assert match_res.status_code == 200
    assert match_res.json()["verdict"] == "Answered"
    assert "remote work across all global developer positions" in match_res.json()["answer"]

    # Delete FAQ
    del_res = client.delete(f"/admin/faq/{faq_id}", headers=auth_header)
    assert del_res.status_code == 200

def test_analytics_calculations(client, auth_header):
    """Test that /admin/stats calculates real analytics dynamically from conversations."""
    stats_res = client.get("/admin/stats", headers=auth_header)
    assert stats_res.status_code == 200
    data = stats_res.json()

    summary = data["summary"]
    assert summary["total_conversations"] > 0
    assert summary["total_answered"] > 0
    assert "verdict_by_category" in data
    assert "response_time_by_category" in data
    assert "answered_down_conversations" in data

    # Verify that answered_down_conversations only contains conversations with verdict=Answered and rating=down
    for item in data["answered_down_conversations"]:
        assert item["verdict"] == "Answered"
        assert item["rating"] == "down"
