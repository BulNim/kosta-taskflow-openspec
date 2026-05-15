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


def _to_out(message: Message, email: str) -> MessageOut:
    return MessageOut(
        id=message.id,
        team_id=message.team_id,
        user_id=message.user_id,
        user_email=email,
        content=message.content,
        created_at=message.created_at,
    )


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
) -> MessageOut:
    require_team_membership(team_id, user, db)
    message = Message(team_id=team_id, user_id=user.id, content=payload.content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return _to_out(message, user.email)


@router.get("/teams/{team_id}/messages", response_model=list[MessageOut])
def list_team_messages(
    team_id: int,
    since: datetime | None = Query(default=None, description="ISO 8601 timestamp"),
    limit: int = Query(default=50, ge=1, le=200, description="1~200"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[MessageOut]:
    require_team_membership(team_id, user, db)

    stmt = select(Message, User.email).join(User, User.id == Message.user_id).where(Message.team_id == team_id)
    if since is not None:
        stmt = stmt.where(Message.created_at > since)
    # 최근 N개를 시간 오름차순으로 반환 → DESC로 limit 후 reverse
    stmt = stmt.order_by(Message.created_at.desc(), Message.id.desc()).limit(limit)

    rows = db.execute(stmt).all()
    out = [_to_out(msg, email) for msg, email in rows]
    out.reverse()
    return out


@router.get("/messages/{message_id}", response_model=MessageOut)
def get_message(
    message_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MessageOut:
    row = db.execute(
        select(Message, User.email).join(User, User.id == Message.user_id).where(Message.id == message_id)
    ).first()
    if row is None:
        raise AppError(404, "MESSAGE_NOT_FOUND", "메시지를 찾을 수 없습니다")
    message, email = row
    require_team_membership(message.team_id, user, db)
    return _to_out(message, email)


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
