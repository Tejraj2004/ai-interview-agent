from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id"),
        nullable=False
    )

    answer_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    technical_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    communication_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    correctness_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    feedback: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )