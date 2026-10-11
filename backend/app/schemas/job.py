
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, ConfigDict


class JobDescriptionCreate(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    company: str | None = Field(default=None, max_length=150)
    description: str = Field(min_length=20)


class JobDescriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    company: str | None
    description: str
    ai_analysis: dict[str, Any] | None = None
    created_at: datetime
