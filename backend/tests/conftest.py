"""
Shared test fixtures for the karuneegar_central backend.

All tests use an in-memory SQLite database. SMS/email sending is mocked via
MOCK_SMS=true. Rate limiting is disabled. Anthropic API calls are never made
in tests — the key is set but the callers are mocked per-test.
"""
import io
import os
import sys
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock

# ── Must set env vars BEFORE importing the Flask app ─────────────────────────
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key-for-testing-only")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("MOCK_SMS", "true")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-anthropic-key")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app as flask_app, db as flask_db  # noqa: E402
from models import (  # noqa: E402
    User, Profile, OtpRequest, MatrimonyProfile,
    BusinessProfile, BusinessAd, ForumCategory, ForumThread,
    ForumReply, FamilyMember, Scholarship,
)


# ── Session-scoped app (created once for the whole test run) ──────────────────

@pytest.fixture(scope="session")
def app():
    flask_app.config.update(
        TESTING=True,
        RATELIMIT_ENABLED=False,
        RATELIMIT_STORAGE_URL="memory://",
        WTF_CSRF_ENABLED=False,
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
    )
    with flask_app.app_context():
        flask_db.create_all()
        _seed_forum_categories()
    yield flask_app
    with flask_app.app_context():
        flask_db.drop_all()


def _seed_forum_categories():
    """Seed the three forum categories used by tests."""
    if ForumCategory.query.count() == 0:
        cats = [
            ForumCategory(name="Business & Trade", description="Business discussions", icon="briefcase"),
            ForumCategory(name="Jobs & Careers",   description="Jobs and career",      icon="person-badge"),
            ForumCategory(name="General Discussion", description="General topics",     icon="chat-dots"),
        ]
        flask_db.session.add_all(cats)
        flask_db.session.commit()


# ── Per-test DB cleanup ───────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def clean_db(app):
    """Delete all rows after each test and re-seed categories."""
    yield
    with app.app_context():
        flask_db.session.remove()
        for table in reversed(flask_db.metadata.sorted_tables):
            flask_db.session.execute(table.delete())
        flask_db.session.commit()
        _seed_forum_categories()


# ── Test client ───────────────────────────────────────────────────────────────

@pytest.fixture
def client(app):
    with app.test_client() as c:
        yield c


# ── OTP helpers ───────────────────────────────────────────────────────────────

OTP_CODE = "123456"


@pytest.fixture
def seed_otp(app):
    """Insert a known OTP directly into the DB, bypassing SMS delivery."""
    def _seed(mobile: str = "+919876543210", code: str = OTP_CODE):
        with app.app_context():
            otp = OtpRequest(
                mobile=mobile,
                code=code,
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            )
            flask_db.session.add(otp)
            flask_db.session.commit()
    return _seed


# ── User registration / login helpers ────────────────────────────────────────

def _do_register(client, seed_otp_fn, *,
                 username="user1",
                 email="user1@example.com",
                 password="password123",
                 mobile="+919876543210",
                 full_name="Test User One"):
    seed_otp_fn(mobile=mobile)
    return client.post("/api/auth/register", json={
        "username":  username,
        "email":     email,
        "password":  password,
        "mobile":    mobile,
        "otp_code":  OTP_CODE,
        "full_name": full_name,
    })


@pytest.fixture
def registered_user(client, seed_otp):
    """Register primary test user; return parsed JSON (includes token)."""
    resp = _do_register(client, seed_otp)
    assert resp.status_code == 201, resp.get_json()
    return resp.get_json()


@pytest.fixture
def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['token']}"}


@pytest.fixture
def registered_user2(client, seed_otp):
    """Second user for ownership / isolation tests."""
    resp = _do_register(
        client, seed_otp,
        username="user2",
        email="user2@example.com",
        mobile="+919876543211",
        full_name="Test User Two",
    )
    assert resp.status_code == 201, resp.get_json()
    return resp.get_json()


@pytest.fixture
def auth_headers2(registered_user2):
    return {"Authorization": f"Bearer {registered_user2['token']}"}


# ── Minimal JPEG for upload tests ─────────────────────────────────────────────

@pytest.fixture(scope="session")
def tiny_jpeg():
    """Return bytes of a 1×1 white-pixel JPEG."""
    from PIL import Image as PILImage
    buf = io.BytesIO()
    PILImage.new("RGB", (1, 1), color=(255, 255, 255)).save(buf, format="JPEG")
    return buf.getvalue()


# ── Convenience: create a business for a user ─────────────────────────────────

@pytest.fixture
def business(client, registered_user, auth_headers):
    """Create and return a business profile for the primary test user."""
    resp = client.post("/api/business", json={
        "company_name": "Acme Corp",
        "category":     "IT & Technology",
        "city":         "Chennai",
        "phone":        "+914412345678",
    }, headers=auth_headers)
    assert resp.status_code == 201, resp.get_json()
    return resp.get_json()["business"]


# ── Convenience: create a matrimony profile ───────────────────────────────────

@pytest.fixture
def matrimony_profile(client, registered_user, auth_headers):
    """Create and return a matrimony profile for the primary test user."""
    resp = client.post("/api/matrimony", json={
        "full_name": "Groom Test",
        "gender":    "male",
        "age":       28,
        "star":      "Rohini",
        "raasi":     "Vrishabha",
    }, headers=auth_headers)
    assert resp.status_code == 201, resp.get_json()
    return resp.get_json()["profile"]


# ── Convenience: get first forum category ─────────────────────────────────────

@pytest.fixture
def forum_category(app):
    """Return the first seeded forum category."""
    with app.app_context():
        return ForumCategory.query.first()
