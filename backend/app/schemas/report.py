
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class InterviewReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    interview_id: int
    overall_score: float | None
    technical_score: float | None
    communication_score: float | None
    strengths: str | None
    weaknesses: str | None
    recommendations: str | None
    created_at: datetime
