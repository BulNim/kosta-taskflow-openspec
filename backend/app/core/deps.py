from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.core.errors import AppError
from backend.app.core.security import TokenError, decode_token
from backend.app.models import TeamMember, User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if creds is None or not creds.credentials:
        raise AppError(401, "UNAUTHORIZED", "Authorization 헤더가 필요합니다")
    try:
        user_id = decode_token(creds.credentials)
    except TokenError as e:
        raise AppError(401, e.code, e.msg)

    user = db.get(User, user_id)
    if user is None:
        raise AppError(401, "UNAUTHORIZED", "사용자를 찾을 수 없습니다")
    return user


def require_team_membership(team_id: int, user: User, db: Session) -> TeamMember:
    membership = db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user.id,
        )
    ).scalar_one_or_none()
    if membership is None:
        raise AppError(403, "NOT_TEAM_MEMBER", "팀 멤버가 아닙니다")
    return membership
