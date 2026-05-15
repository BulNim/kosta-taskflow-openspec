from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.core.deps import get_current_user, require_team_membership
from backend.app.core.errors import AppError
from backend.app.core.invite_code import generate_invite_code
from backend.app.models import Team, TeamMember, User
from backend.app.schemas.team import MemberOut, TeamCreateIn, TeamJoinIn, TeamOut

router = APIRouter(prefix="/teams", tags=["teams"])

_INVITE_CODE_MAX_RETRY = 8


def _set_current_team_if_unset(user: User, team_id: int) -> None:
    if user.current_team_id is None:
        user.current_team_id = team_id


@router.post("", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
def create_team(
    payload: TeamCreateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Team:
    for _ in range(_INVITE_CODE_MAX_RETRY):
        team = Team(name=payload.name, invite_code=generate_invite_code(), owner_id=user.id)
        db.add(team)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            continue
        db.add(TeamMember(team_id=team.id, user_id=user.id, role="admin"))
        _set_current_team_if_unset(user, team.id)
        db.commit()
        db.refresh(team)
        return team
    raise AppError(500, "INVITE_CODE_GENERATION_FAILED", "초대코드 발급에 반복 실패했습니다")


@router.get("", response_model=list[TeamOut])
def list_my_teams(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Team]:
    rows = db.execute(
        select(Team)
        .join(TeamMember, TeamMember.team_id == Team.id)
        .where(TeamMember.user_id == user.id)
    ).scalars().all()
    return list(rows)


@router.post("/join", response_model=TeamOut)
def join_team(
    payload: TeamJoinIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Team:
    team = db.execute(
        select(Team).where(Team.invite_code == payload.invite_code)
    ).scalar_one_or_none()
    if team is None:
        raise AppError(404, "INVALID_INVITE_CODE", "유효하지 않은 초대코드입니다")

    existing = db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team.id,
            TeamMember.user_id == user.id,
        )
    ).scalar_one_or_none()
    if existing is None:
        db.add(TeamMember(team_id=team.id, user_id=user.id, role="member"))
    _set_current_team_if_unset(user, team.id)
    db.commit()
    return team


@router.get("/{team_id}/members", response_model=list[MemberOut])
def list_team_members(
    team_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[User]:
    require_team_membership(team_id, user, db)
    rows = db.execute(
        select(User)
        .join(TeamMember, TeamMember.user_id == User.id)
        .where(TeamMember.team_id == team_id)
    ).scalars().all()
    return list(rows)
