from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    interview_id: Mapped[int] = mapped_column(
        ForeignKey("interviews.id"),
        nullable=False
    )

    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    question_type: Mapped[str] = mapped_column(
        String(50),
        default="technical"
    )

    difficulty: Mapped[str] = mapped_column(
        String(30),
        default="medium"
    )

    order_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )