"""
Integration tests for authentication endpoints.

Fixtures from conftest.py: app, client, clean_db (autouse),
seed_otp, registered_user, auth_headers, OTP_CODE
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from conftest import OTP_CODE


# ── Health & Stats ────────────────────────────────────────────────────────────

def test_health_returns_ok(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "ok"


def test_stats_returns_counts(client):
    resp = client.get("/api/stats")
    assert resp.status_code == 200
    data = resp.get_json()
    for key in ("members", "families", "forum_threads", "matrimony_profiles"):
        assert key in data


# ── Send OTP ──────────────────────────────────────────────────────────────────

def test_send_otp_indian_number_succeeds(client):
    with patch("main.send_otp_autogen", return_value="12345"):
        resp = client.post("/api/auth/send-otp", json={"mobile": "+919876543210"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert "message" in data
    assert data.get("via") == "sms"


def test_send_otp_duplicate_mobile_returns_409(client, registered_user):
    resp = client.post("/api/auth/send-otp", json={"mobile": "+919876543210"})
    assert resp.status_code == 409


# ── Register ──────────────────────────────────────────────────────────────────

def test_register_success(client, seed_otp):
    seed_otp(mobile="+919876543210")
    resp = client.post("/api/auth/register", json={
        "username":  "newuser",
        "email":     "newuser@example.com",
        "password":  "password123",
        "mobile":    "+919876543210",
        "otp_code":  OTP_CODE,
        "full_name": "New User",
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert "token" in data
    assert data["user"]["username"] == "newuser"


def test_register_missing_required_fields_returns_400(client, seed_otp):
    seed_otp()
    resp = client.post("/api/auth/register", json={
        "username": "missingfields",
        "email":    "mf@example.com",
        # password missing
        "mobile":   "+919876543210",
        "otp_code": OTP_CODE,
    })
    assert resp.status_code == 400


def test_register_wrong_otp_returns_400(client, seed_otp):
    seed_otp()
    resp = client.post("/api/auth/register", json={
        "username":  "wrongotp",
        "email":     "wrong@example.com",
        "password":  "password123",
        "mobile":    "+919876543210",
        "otp_code":  "000000",
    })
    assert resp.status_code == 400


def test_register_expired_otp_returns_400(client, app):
    from models import OtpRequest
    from main import db
    with app.app_context():
        otp = OtpRequest(
            mobile="+919876543210",
            code=OTP_CODE,
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
        )
        db.session.add(otp)
        db.session.commit()

    resp = client.post("/api/auth/register", json={
        "username":  "expiredotp",
        "email":     "expired@example.com",
        "password":  "password123",
        "mobile":    "+919876543210",
        "otp_code":  OTP_CODE,
    })
    assert resp.status_code == 400


def test_register_duplicate_username_returns_409(client, registered_user, seed_otp):
    seed_otp(mobile="+919876543299")
    resp = client.post("/api/auth/register", json={
        "username":  "user1",          # same as registered_user
        "email":     "other@example.com",
        "password":  "password123",
        "mobile":    "+919876543299",
        "otp_code":  OTP_CODE,
    })
    assert resp.status_code == 409


def test_register_duplicate_email_returns_409(client, registered_user, seed_otp):
    seed_otp(mobile="+919876543299")
    resp = client.post("/api/auth/register", json={
        "username":  "newusername",
        "email":     "user1@example.com",  # same as registered_user
        "password":  "password123",
        "mobile":    "+919876543299",
        "otp_code":  OTP_CODE,
    })
    assert resp.status_code == 409


def test_register_duplicate_mobile_returns_409(client, registered_user, seed_otp):
    seed_otp(mobile="+919876543210")  # same mobile as registered_user
    resp = client.post("/api/auth/register", json={
        "username":  "uniqueusername",
        "email":     "unique@example.com",
        "password":  "password123",
        "mobile":    "+919876543210",  # duplicate
        "otp_code":  OTP_CODE,
    })
    assert resp.status_code == 409


# ── Login ─────────────────────────────────────────────────────────────────────

def test_login_with_email_succeeds(client, registered_user):
    resp = client.post("/api/auth/login", json={
        "email":    "user1@example.com",
        "password": "password123",
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert "token" in data
    assert data["user"]["email"] == "user1@example.com"


def test_login_with_username_succeeds(client, registered_user):
    resp = client.post("/api/auth/login", json={
        "username": "user1",
        "password": "password123",
    })
    assert resp.status_code == 200
    assert "token" in resp.get_json()


def test_login_wrong_password_returns_401(client, registered_user):
    resp = client.post("/api/auth/login", json={
        "email":    "user1@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


def test_login_nonexistent_user_returns_401(client):
    resp = client.post("/api/auth/login", json={
        "email":    "nobody@example.com",
        "password": "whatever",
    })
    assert resp.status_code == 401


# ── Auth/Me ───────────────────────────────────────────────────────────────────

def test_get_me_authenticated_returns_user(client, registered_user, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["user"]["username"] == "user1"


def test_get_me_no_token_returns_401(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_get_me_invalid_token_returns_401(client):
    resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    # flask-jwt-extended returns 422 for malformed tokens, 401 for missing/expired
    assert resp.status_code in (401, 422)
