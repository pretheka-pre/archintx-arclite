from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
try:
    from backend.app.config import settings
    from backend.app.database import engine, Base, SessionLocal
    from backend.app.seed import seed_database
    from backend.app.routers import chat, auth, admin
except ImportError:
    from app.config import settings
    from app.database import engine, Base, SessionLocal
    from app.seed import seed_database
    from app.routers import chat, auth, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Automatically seed initial staff user and FAQ entries if empty
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=f"{settings.COMPANY_NAME} – {settings.PROJECT_NAME} API",
    description="Production-grade AI-powered FAQ Assistant with TF-IDF cosine matching, anti-hallucination verification, real-time analytics, and staff portal.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
if settings.FRONTEND_URL and settings.FRONTEND_URL != "*":
    origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.FRONTEND_URL == "*" else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred.", "error": str(exc)},
    )

# Include Routers
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(admin.router)

@app.get("/", tags=["System"])
def root():
    return {
        "app": settings.PROJECT_NAME,
        "company": settings.COMPANY_NAME,
        "status": "online",
        "docs": "/docs",
        "matching_engine": "TF-IDF + Cosine Similarity (Scikit-Learn)",
        "high_confidence_threshold": settings.HIGH_CONFIDENCE_THRESHOLD,
        "low_confidence_threshold": settings.LOW_CONFIDENCE_THRESHOLD,
        "ambiguity_margin": settings.AMBIGUITY_MARGIN
    }

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy"}
