from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    job_description_id: Mapped[int] = mapped_column(
        ForeignKey("job_descriptions.id"),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="created"
    )

    difficulty: Mapped[str] = mapped_column(
        String(30),
        default="medium"
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )