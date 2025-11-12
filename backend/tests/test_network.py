from __future__ import annotations

import hashlib

from fastapi.testclient import TestClient

from app.main import app
from app.state import reset_state

client = TestClient(app)


def login() -> None:
    reset_state()
    password = hashlib.sha256("password".encode()).hexdigest()
    response = client.post(
        "/cgi-bin/entry.cgi/system/system/login",
        json={"sUserName": "admin", "sPassword": password},
    )
    assert response.status_code == 200


def test_get_network_wlan() -> None:
    login()
    response = client.get("/cgi-bin/entry.cgi/network/wlan")
    assert response.status_code == 200
    data = response.json()
    assert "dIpv4" in data


def test_wifi_power_toggle() -> None:
    login()
    response = client.post(
        "/cgi-bin/entry.cgi/network/wifi",
        json={"power": "off"},
    )
    assert response.status_code == 200
    assert response.json()["iPower"] == 0
