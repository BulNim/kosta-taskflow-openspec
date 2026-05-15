from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.core.deps import get_current_user, require_team_membership
from backend.app.core.errors import AppError
from backend.app.models import Message, User
from backend.app.schemas.message import MessageCreateIn, MessageOut

router = APIRouter(tags=["messages"])


@router.post(
    "/teams/{team_id}/messages",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
)
def create_message(
    team_id: int,
    payload: MessageCreateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Message:
    require_team_membership(team_id, user, db)
    message = Message(team_id=team_id, user_id=user.id, content=payload.content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/teams/{team_id}/messages", response_model=list[MessageOut])
def list_team_messages(
    team_id: int,
    since: datetime | None = Query(default=None, description="ISO 8601 timestamp; 이후 메시지만 반환"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Message]:
    require_team_membership(team_id, user, db)
    stmt = select(Message).where(Message.team_id == team_id)
    if since is not None:
        stmt = stmt.where(Message.created_at > since)
    stmt = stmt.order_by(Message.created_at.asc())
    rows = db.execute(stmt).scalars().all()
    return list(rows)


@router.get("/messages/{message_id}", response_model=MessageOut)
def get_message(
    message_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Message:
    message = db.get(Message, message_id)
    if message is None:
        raise AppError(404, "MESSAGE_NOT_FOUND", "메시지를 찾을 수 없습니다")
    require_team_membership(message.team_id, user, db)
    return message


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    message = db.get(Message, message_id)
    if message is None:
        raise AppError(404, "MESSAGE_NOT_FOUND", "메시지를 찾을 수 없습니다")
    if message.user_id != user.id:
        raise AppError(403, "NOT_MESSAGE_OWNER", "본인의 메시지만 삭제할 수 있습니다")
    db.delete(message)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
