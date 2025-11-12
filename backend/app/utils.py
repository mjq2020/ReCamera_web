from __future__ import annotations

import secrets
from datetime import datetime, timezone
from typing import Any, Dict


def random_status() -> Dict[str, int]:
    return {
        "iCpuUsage": secrets.randbelow(101),
        "iNpuUsage": secrets.randbelow(101),
        "iMemUsage": secrets.randbelow(101),
        "iStorageUsage": secrets.randbelow(101),
    }


def current_timestamp_payload(tz: str = "Asia/Shanghai", tz_name: str = "UTC+8") -> Dict[str, Any]:
    return {
        "iTimstemp": int(datetime.now(tz=timezone.utc).timestamp()),
        "sTimezone": tz,
        "sTz": tz_name,
    }


def success_response(data: Any) -> Dict[str, Any]:
    return data


def error_response(message: str, status: int = 0) -> Dict[str, Any]:
    return {"status": status, "message": message}
