
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AnswerCreate(BaseModel):
    answer_text: str = Field(min_length=1, max_length=20000)


class AnswerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question_id: int
    answer_text: str
    technical_score: float | None
    communication_score: float | None
    correctness_score: float | None
    feedback: str | None
    created_at: datetime
