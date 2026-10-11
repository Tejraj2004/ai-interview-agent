
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.question import Question
from app.ai.question_generator import generate_interview_questions
from app.schemas.question import QuestionResponse

from app.database import get_db
from app.models.interview import Interview
from app.models.job_description import JobDescription
from app.models.user import User
from app.schemas.interview import InterviewCreate, InterviewResponse
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/interviews",
    tags=["Interviews"],
)


@router.post(
    "",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_interview(
    interview_data: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Confirm that this job belongs to the logged-in user.
    job = (
        db.query(JobDescription)
        .filter(
            JobDescription.id == interview_data.job_description_id,
            JobDescription.user_id == current_user.id,
        )
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found",
        )

    difficulty = interview_data.difficulty.lower()

    if difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Difficulty must be easy, medium, or hard",
        )

    interview = Interview(
        user_id=current_user.id,
        job_description_id=job.id,
        difficulty=difficulty,
        status="created",
    )

    try:
        db.add(interview)
        db.commit()
        db.refresh(interview)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create interview",
        )

    return interview


@router.get(
    "",
    response_model=list[InterviewResponse],
)
def get_my_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == current_user.id)
        .order_by(Interview.id.desc())
        .all()
    )

    return interviews


@router.post(
    "/{interview_id}/generate-questions",
    response_model=list[QuestionResponse],
)
def generate_questions_for_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find the interview belonging to the logged-in user.
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == current_user.id,
        )
        .first()
    )

    if interview is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )

    # Load the job description linked to this interview.
    job = (
        db.query(JobDescription)
        .filter(
            JobDescription.id == interview.job_description_id,
            JobDescription.user_id == current_user.id,
        )
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found",
        )

    if not job.ai_analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description has no AI analysis",
        )

    # Avoid generating duplicate questions for the same interview.
    existing_questions = (
        db.query(Question)
        .filter(Question.interview_id == interview.id)
        .order_by(Question.order_number)
        .all()
    )

    if existing_questions:
        return existing_questions

    # Generate questions using the saved job analysis.
    try:
        generated_questions = generate_interview_questions(
            job_title=job.title,
            job_description=job.description,
            job_analysis=job.ai_analysis,
            difficulty=interview.difficulty,
            number_of_questions=10,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Question generation failed. Please try again.",
        )

    # Save the generated questions.
    questions = []

    try:
        for index, item in enumerate(generated_questions, start=1):
            question = Question(
                interview_id=interview.id,
                question_text=item["question_text"],
                question_type=item["question_type"],
                difficulty=item["difficulty"],
                order_number=index,
            )
            questions.append(question)
            db.add(question)

        db.commit()

        for question in questions:
            db.refresh(question)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save interview questions",
        )

    return questions
