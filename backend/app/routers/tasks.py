from fastapi import APIRouter, Depends, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.core.deps import get_current_user, require_team_membership
from backend.app.core.errors import AppError
from backend.app.models import Task, User
from backend.app.schemas.task import TaskCreateIn, TaskOut, TaskUpdateIn

router = APIRouter(tags=["tasks"])


@router.post(
    "/teams/{team_id}/tasks",
    response_model=TaskOut,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    team_id: int,
    payload: TaskCreateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Task:
    require_team_membership(team_id, user, db)
    task = Task(team_id=team_id, title=payload.title, creator_id=user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/teams/{team_id}/tasks", response_model=list[TaskOut])
def list_team_tasks(
    team_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Task]:
    require_team_membership(team_id, user, db)
    rows = db.execute(select(Task).where(Task.team_id == team_id).order_by(Task.id)).scalars().all()
    return list(rows)


def _get_task_for_user(task_id: int, db: Session, user: User) -> Task:
    task = db.get(Task, task_id)
    if task is None:
        raise AppError(404, "TASK_NOT_FOUND", "태스크를 찾을 수 없습니다")
    require_team_membership(task.team_id, user, db)
    return task


@router.get("/tasks/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Task:
    return _get_task_for_user(task_id, db, user)


@router.put("/tasks/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Task:
    task = _get_task_for_user(task_id, db, user)
    if payload.title is not None:
        task.title = payload.title
    if payload.status is not None:
        task.status = payload.status
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    task = _get_task_for_user(task_id, db, user)
    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
