import secrets
import string

_ALPHABET = string.ascii_uppercase + string.digits  # 36자 (영문 대문자 + 숫자)


def generate_invite_code() -> str:
    """`XXXX-XXXX` 형식 (영숫자 대문자 4-4 하이픈)."""
    block1 = "".join(secrets.choice(_ALPHABET) for _ in range(4))
    block2 = "".join(secrets.choice(_ALPHABET) for _ in range(4))
    return f"{block1}-{block2}"
