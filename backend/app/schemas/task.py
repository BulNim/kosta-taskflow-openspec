from pydantic import BaseModel, Field

from backend.app.models.task import TaskStatus


class TaskCreateIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class TaskUpdateIn(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    status: TaskStatus | None = None


class TaskOut(BaseModel):
    id: int
    team_id: int
    title: str
    status: TaskStatus
    creator_id: int

    model_config = {"from_attributes": True}
