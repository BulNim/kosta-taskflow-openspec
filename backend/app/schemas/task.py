from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field

from backend.app.models.task import TaskStatus


class TaskFilter(str, Enum):
    ALL = "all"
    MINE = "mine"
    UNASSIGNED = "unassigned"


class TaskSort(str, Enum):
    CREATED_AT_DESC = "created_at_desc"
    CREATED_AT_ASC = "created_at_asc"


class TaskCreateIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    assignee_id: int | None = None


class TaskUpdateIn(BaseModel):
    """부분 업데이트. 명시적으로 보낸 필드만 변경.

    `assignee_id: null`을 보내면 미할당으로 설정.
    omitted 필드는 변경되지 않음 (model_dump(exclude_unset=True) 사용).
    """

    title: str | None = Field(default=None, min_length=1, max_length=200)
    status: TaskStatus | None = None
    assignee_id: int | None = None


class TaskOut(BaseModel):
    id: int
    team_id: int
    title: str
    status: TaskStatus
    creator_id: int
    assignee_id: int | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
