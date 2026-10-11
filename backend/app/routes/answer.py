
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.ai.answer_evaluator import evaluate_answer
from app.database import get_db
from app.models.answer import Answer
from app.models.interview import Interview
from app.models.question import Question
from app.models.user import User
from app.schemas.answer import AnswerCreate, AnswerResponse
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/answers",
    tags=["Answers"],
)

@router.get(
    "/questions/{question_id}",
    response_model=AnswerResponse | None,
)
def get_question_answer(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question = (
        db.query(Question)
        .filter(Question.id == question_id)
        .first()
    )

    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    interview = (
        db.query(Interview)
        .filter(
            Interview.id == question.interview_id,
            Interview.user_id == current_user.id,
        )
        .first()
    )

    if interview is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    answer = (
        db.query(Answer)
        .filter(Answer.question_id == question_id)
        .first()
    )

    return answer

@router.post(
    "/questions/{question_id}",
    response_model=AnswerResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_answer(
    question_id: int,
    answer_data: AnswerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find the question.
    question = (
        db.query(Question)
        .filter(Question.id == question_id)
        .first()
    )

    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    # Verify that the interview belongs to the logged-in user.
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == question.interview_id,
            Interview.user_id == current_user.id,
        )
        .first()
    )

    if interview is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    # Prevent multiple submissions for the same question.
    existing_answer = (
        db.query(Answer)
        .filter(Answer.question_id == question_id)
        .first()
    )

    if existing_answer is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An answer already exists for this question",
        )

    answer = Answer(
        question_id=question_id,
        answer_text=answer_data.answer_text.strip(),
    )

    if not answer.answer_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Answer cannot be empty",
        )

    try:
        db.add(answer)
        db.commit()
        db.refresh(answer)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save answer",
        )

    return answer


@router.post(
    "/{answer_id}/evaluate",
    response_model=AnswerResponse,
)
def evaluate_submitted_answer(
    answer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find the saved answer.
    answer = (
        db.query(Answer)
        .filter(Answer.id == answer_id)
        .first()
    )

    if answer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found",
        )

    # Find its associated question.
    question = (
        db.query(Question)
        .filter(Question.id == answer.question_id)
        .first()
    )

    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    # Verify ownership of the interview.
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == question.interview_id,
            Interview.user_id == current_user.id,
        )
        .first()
    )

    if interview is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found",
        )

    # Return existing evaluation without calling AI again.
    if (
        answer.technical_score is not None
        and answer.communication_score is not None
        and answer.correctness_score is not None
        and answer.feedback is not None
    ):
        return answer

    # Evaluate using Groq + LangChain.
    try:
        evaluation = evaluate_answer(
            question_text=question.question_text,
            answer_text=answer.answer_text,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI evaluation failed. Please try again.",
        )

    # Store the scores and feedback.
    answer.technical_score = evaluation["technical_score"]
    answer.communication_score = evaluation["communication_score"]
    answer.correctness_score = evaluation["correctness_score"]
    answer.feedback = evaluation["feedback"]

    try:
        db.commit()
        db.refresh(answer)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save evaluation",
        )

    return answer

