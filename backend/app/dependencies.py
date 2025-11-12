from __future__ import annotations

from fastapi import Cookie, HTTPException, status

from .state import state


def require_auth(token: str | None = Cookie(default=None)) -> str:
    if token is None or token not in state.tokens:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    return state.tokens[token]
