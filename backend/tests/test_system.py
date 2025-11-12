from __future__ import annotations

import hashlib

from fastapi.testclient import TestClient

from app.main import app
from app.state import reset_state, state

client = TestClient(app)


def login() -> None:
    reset_state()
    password = hashlib.sha256("password".encode()).hexdigest()
    response = client.post(
        "/cgi-bin/entry.cgi/system/system/login",
        json={"sUserName": "admin", "sPassword": password},
    )
    assert response.status_code == 200


def test_login_and_device_info() -> None:
    login()
    response = client.get("/cgi-bin/entry.cgi/system/device-info")
    assert response.status_code == 200
    body = response.json()
    assert "sSerialNumber" in body


def test_time_update_manual() -> None:
    login()
    response = client.put(
        "/cgi-bin/entry.cgi/system/time",
        json={
            "sMethod": "manual",
            "iTimestamp": 1700000000,
        },
    )
    assert response.status_code == 200
    assert response.json()["iTimstemp"] == 1700000000
