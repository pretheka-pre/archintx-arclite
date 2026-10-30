from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Staff
from backend.app.schemas import LoginRequest, TokenResponse
from backend.app.auth import verify_password, create_access_token, get_current_staff

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    staff = db.query(Staff).filter(Staff.email == email).first()

    if not staff or not verify_password(payload.password, staff.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(data={"sub": staff.email})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        email=staff.email
    )

@router.get("/me")
def get_current_user_profile(current_staff: Staff = Depends(get_current_staff)):
    return {
        "id": current_staff.id,
        "email": current_staff.email,
        "created_at": current_staff.created_at
    }
