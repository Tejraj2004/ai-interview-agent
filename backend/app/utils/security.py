
from datetime import datetime, timedelta, timezone

from jose import jwt
from pwdlib import PasswordHash
from jose import JWTError

from app.config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return password_hash.verify(
        plain_password,
        hashed_password
    )


def create_access_token(user_id: int) -> str:
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY is missing from .env")

    if ACCESS_TOKEN_EXPIRE_MINUTES <= 0:
        raise ValueError("Token expiration must be positive")

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

def decode_access_token(token: str) -> dict:
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY is missing from .env")

    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
    )

