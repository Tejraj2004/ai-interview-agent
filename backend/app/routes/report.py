
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.answer import Answer
from app.models.interview import Interview
from app.models.job_description import JobDescription
from app.models.question import Question
from app.models.report import InterviewReport
from app.models.user import User
from app.schemas.report import InterviewReportResponse
from app.utils.dependencies import get_current_user
from app.ai.report_generator import generate_report_feedback


router = APIRouter(
    prefix="/reports",
    tags=["Interview Reports"],
)


@router.post(
    "/interviews/{interview_id}",
    response_model=InterviewReportResponse,
)
def create_interview_report(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify that the interview belongs to the logged-in user.
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

    # Find the job description.
    job = (
        db.query(JobDescription)
        .filter(JobDescription.id == interview.job_description_id)
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found",
        )

    # Get all questions for this interview and their saved answers.
    question_rows = (
        db.query(Question, Answer)
        .outerjoin(Answer, Answer.question_id == Question.id)
        .filter(Question.interview_id == interview.id)
        .order_by(Question.order_number)
        .all()
    )

    if not question_rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Generate interview questions before creating a report",
        )

    answered_rows = [
        (question, answer)
        for question, answer in question_rows
        if answer is not None
    ]

    if not answered_rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submit and evaluate at least one answer first",
        )

    # Require every submitted answer to have an evaluation.
    unevaluated = [
        answer.id
        for _, answer in answered_rows
        if (
            answer.technical_score is None
            or answer.communication_score is None
            or answer.correctness_score is None
            or answer.feedback is None
        )
    ]

    if unevaluated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Evaluate all submitted answers before creating a report",
        )

    # Calculate averages from the saved evaluation scores.
    technical_scores = [
        answer.technical_score for _, answer in answered_rows
    ]
    communication_scores = [
        answer.communication_score for _, answer in answered_rows
    ]
    correctness_scores = [
        answer.correctness_score for _, answer in answered_rows
    ]

    technical_average = sum(technical_scores) / len(technical_scores)
    communication_average = (
        sum(communication_scores) / len(communication_scores)
    )
    correctness_average = (
        sum(correctness_scores) / len(correctness_scores)
    )

    # Equal weighting across all three score categories.
    overall_score = (
        technical_average
        + communication_average
        + correctness_average
    ) / 3

    # Prepare the evidence for AI-generated feedback.
    answer_summaries = []

    for question, answer in answered_rows:
        answer_summaries.append({
            "question": question.question_text,
            "answer": answer.answer_text,
            "technical_score": answer.technical_score,
            "communication_score": answer.communication_score,
            "correctness_score": answer.correctness_score,
            "feedback": answer.feedback,
        })

    # Generate strengths, weaknesses, and recommendations.
    try:
        feedback = generate_report_feedback(
            interview_title=job.title,
            answer_summaries=answer_summaries,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI report generation failed. Please try again.",
        )

    # Create or update the report for this interview.
    report = (
        db.query(InterviewReport)
        .filter(InterviewReport.interview_id == interview.id)
        .first()
    )

    if report is None:
        report = InterviewReport(interview_id=interview.id)
        db.add(report)

    report.overall_score = round(overall_score, 2)
    report.technical_score = round(technical_average, 2)
    report.communication_score = round(communication_average, 2)
    report.strengths = feedback["strengths"]
    report.weaknesses = feedback["weaknesses"]
    report.recommendations = feedback["recommendations"]

    try:
        db.commit()
        db.refresh(report)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save interview report",
        )

    return report


@router.get(
    "/interviews/{interview_id}",
    response_model=InterviewReportResponse,
)
def get_interview_report(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify interview ownership before returning its report.
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

    report = (
        db.query(InterviewReport)
        .filter(InterviewReport.interview_id == interview.id)
        .first()
    )

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    return report
