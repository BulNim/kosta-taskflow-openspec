from datetime import datetime

from pydantic import BaseModel, Field


class MessageCreateIn(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


class MessageOut(BaseModel):
    id: int
    team_id: int
    user_id: int
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
