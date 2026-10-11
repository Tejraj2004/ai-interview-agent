
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.job_description import JobDescription
from app.models.user import User
from app.schemas.job import (
    JobDescriptionCreate,
    JobDescriptionResponse,
)
from app.utils.dependencies import get_current_user
from app.ai.job_analyzer import analyze_job_description


router = APIRouter(
    prefix="/jobs",
    tags=["Job Descriptions"],
)


@router.post(
    "",
    response_model=JobDescriptionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_job_description(
    job_data: JobDescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Step 1: Analyze the job description using AI
    try:
        analysis = analyze_job_description(
            job_title=job_data.title,
            job_description=job_data.description,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI job analysis failed. Please try again.",
        )

    # Step 2: Save the job and AI analysis
    new_job = JobDescription(
        user_id=current_user.id,
        title=job_data.title,
        company=job_data.company,
        description=job_data.description,
        ai_analysis=analysis,
    )

    try:
        db.add(new_job)
        db.commit()
        db.refresh(new_job)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save job description",
        )

    return new_job


@router.get(
    "",
    response_model=list[JobDescriptionResponse],
)
def get_my_job_descriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    jobs = (
        db.query(JobDescription)
        .filter(JobDescription.user_id == current_user.id)
        .order_by(JobDescription.created_at.desc())
        .all()
    )

    return jobs


@router.get(
    "/{job_id}",
    response_model=JobDescriptionResponse,
)
def get_job_description(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = (
        db.query(JobDescription)
        .filter(
            JobDescription.id == job_id,
            JobDescription.user_id == current_user.id,
        )
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found",
        )

    return job
