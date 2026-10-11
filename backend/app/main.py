from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.routes.job import router as job_router
from app.routes.report import router as report_router
from app.routes.interview import router as interview_router
from app.database import Base, engine
from app.routes.answer import router as answer_router
from app.models import (
    User,
    JobDescription,
    Interview,
    Question,
    Answer,
    InterviewReport
)
from app.routes.auth import router as auth_router

Base.metadata.create_all(bind=engine)
app = FastAPI(
    title="AI Interview Agent API",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
def home():
    return {
        "message": "AI Interview Agent API running successfully"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/health/database")
def database_health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "healthy",
        "database": "connected"
    }
app.include_router(auth_router)
app.include_router(auth_router)
app.include_router(job_router)
app.include_router(interview_router)
app.include_router(answer_router)
app.include_router(report_router)