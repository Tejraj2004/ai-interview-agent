from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class InterviewReport(Base):
    __tablename__ = "interview_reports"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    interview_id: Mapped[int] = mapped_column(
        ForeignKey("interviews.id"),
        unique=True,
        nullable=False
    )

    overall_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    technical_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    communication_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    strengths: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    weaknesses: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    recommendations: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )