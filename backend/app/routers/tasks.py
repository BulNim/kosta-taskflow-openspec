from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.core.deps import get_current_user, require_team_membership
from backend.app.core.errors import AppError
from backend.app.models import Task, TeamMember, User
from backend.app.schemas.task import TaskCreateIn, TaskFilter, TaskOut, TaskSort, TaskUpdateIn

router = APIRouter(tags=["tasks"])


def _validate_assignee(db: Session, team_id: int, assignee_id: int | None) -> None:
    if assignee_id is None:
        return
    membership = db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == assignee_id,
        )
    ).scalar_one_or_none()
    if membership is None:
        raise AppError(400, "ASSIGNEE_NOT_TEAM_MEMBER", "담당자는 해당 팀 멤버여야 합니다")


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
    _validate_assignee(db, team_id, payload.assignee_id)
    task = Task(
        team_id=team_id,
        title=payload.title,
        creator_id=user.id,
        assignee_id=payload.assignee_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/teams/{team_id}/tasks", response_model=list[TaskOut])
def list_team_tasks(
    team_id: int,
    filter: TaskFilter = Query(default=TaskFilter.ALL),
    sort: TaskSort = Query(default=TaskSort.CREATED_AT_DESC),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Task]:
    require_team_membership(team_id, user, db)
    stmt = select(Task).where(Task.team_id == team_id)

    if filter == TaskFilter.MINE:
        stmt = stmt.where(Task.assignee_id == user.id)
    elif filter == TaskFilter.UNASSIGNED:
        stmt = stmt.where(Task.assignee_id.is_(None))

    if sort == TaskSort.CREATED_AT_DESC:
        stmt = stmt.order_by(Task.created_at.desc(), Task.id.desc())
    else:
        stmt = stmt.order_by(Task.created_at.asc(), Task.id.asc())

    rows = db.execute(stmt).scalars().all()
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
    fields = payload.model_dump(exclude_unset=True)
    if "title" in fields and fields["title"] is not None:
        task.title = fields["title"]
    if "status" in fields and fields["status"] is not None:
        task.status = fields["status"]
    if "assignee_id" in fields:
        _validate_assignee(db, task.team_id, fields["assignee_id"])
        task.assignee_id = fields["assignee_id"]
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
