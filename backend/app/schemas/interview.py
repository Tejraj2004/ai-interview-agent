
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InterviewCreate(BaseModel):
    job_description_id: int = Field(gt=0)
    difficulty: str = "medium"


class InterviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_description_id: int
    status: str
    difficulty: str
    started_at: datetime | None
    completed_at: datetime | None
