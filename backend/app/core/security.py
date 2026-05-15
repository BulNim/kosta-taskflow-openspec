from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from backend.app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=settings.JWT_EXPIRES_HOURS)).timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


class TokenError(Exception):
    def __init__(self, code: str, msg: str):
        super().__init__(msg)
        self.code = code
        self.msg = msg


def decode_token(token: str) -> int:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as e:
        raise TokenError("TOKEN_EXPIRED", "토큰이 만료되었습니다") from e
    except JWTError as e:
        raise TokenError("UNAUTHORIZED", "유효하지 않은 토큰입니다") from e

    sub = payload.get("sub")
    if sub is None:
        raise TokenError("UNAUTHORIZED", "토큰에 사용자 식별자가 없습니다")
    try:
        return int(sub)
    except (TypeError, ValueError) as e:
        raise TokenError("UNAUTHORIZED", "토큰의 사용자 식별자가 유효하지 않습니다") from e
