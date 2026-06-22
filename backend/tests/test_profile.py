"""
Integration tests for profile endpoints.

Fixtures from conftest.py: app, client, clean_db (autouse),
seed_otp, registered_user, auth_headers, registered_user2, auth_headers2, OTP_CODE
"""
from conftest import OTP_CODE, _do_register


# ── GET own profile ───────────────────────────────────────────────────────────

def test_get_own_profile_returns_user_and_profile(client, registered_user, auth_headers):
    resp = client.get("/api/profile", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert "user" in data
    assert "profile" in data
    assert data["user"]["username"] == "user1"


# ── Update profile ────────────────────────────────────────────────────────────

def test_update_profile_full_name(client, registered_user, auth_headers):
    resp = client.put("/api/profile", json={"full_name": "Updated Name"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["user"]["full_name"] == "Updated Name"


def test_update_profile_multiple_fields(client, registered_user, auth_headers):
    resp = client.put("/api/profile", json={
        "bio":        "A brief bio.",
        "location":   "Chennai",
        "occupation": "Engineer",
    }, headers=auth_headers)
    assert resp.status_code == 200
    profile = resp.get_json()["profile"]
    assert profile["bio"] == "A brief bio."
    assert profile["location"] == "Chennai"
    assert profile["occupation"] == "Engineer"


def test_update_profile_unauthenticated_returns_401(client):
    resp = client.put("/api/profile", json={"full_name": "Ghost"})
    assert resp.status_code == 401


# ── Mobile visibility ─────────────────────────────────────────────────────────

def test_toggle_mobile_visibility_to_public(client, registered_user, auth_headers):
    resp = client.patch("/api/profile/mobile-visibility",
                        json={"mobile_public": True},
                        headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["mobile_public"] is True


def test_toggle_mobile_visibility_to_private(client, registered_user, auth_headers):
    # First make it public
    client.patch("/api/profile/mobile-visibility",
                 json={"mobile_public": True},
                 headers=auth_headers)
    # Then private
    resp = client.patch("/api/profile/mobile-visibility",
                        json={"mobile_public": False},
                        headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["mobile_public"] is False


# ── Public profile ────────────────────────────────────────────────────────────

def test_get_public_profile_by_username(client, registered_user, auth_headers):
    # Make profile public first
    client.put("/api/profile", json={"is_public": True}, headers=auth_headers)

    resp = client.get("/api/users/user1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["user"]["username"] == "user1"


def test_get_nonexistent_username_returns_404(client):
    resp = client.get("/api/users/nosuchuserexists99")
    assert resp.status_code == 404


# ── Members list ──────────────────────────────────────────────────────────────

def test_list_members_returns_paginated_list(client, registered_user, auth_headers,
                                              registered_user2, auth_headers2):
    # Make both users' profiles public
    client.put("/api/profile", json={"is_public": True}, headers=auth_headers)
    client.put("/api/profile", json={"is_public": True}, headers=auth_headers2)

    resp = client.get("/api/members")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "members" in data
    assert data["total"] >= 1
    assert "pages" in data
    assert "page" in data


def test_list_members_search_filters_by_name(client, seed_otp, registered_user, auth_headers):
    # Update registered_user full name
    client.put("/api/profile", json={"full_name": "Rajan Kumar", "is_public": True},
               headers=auth_headers)

    resp = client.get("/api/members?q=Rajan")
    assert resp.status_code == 200
    data = resp.get_json()
    names = [m["full_name"] for m in data["members"]]
    assert any("Rajan" in (n or "") for n in names)


# ── Stats ─────────────────────────────────────────────────────────────────────

def test_stats_increment_after_registration(client, registered_user):
    resp = client.get("/api/stats")
    assert resp.status_code == 200
    assert resp.get_json()["members"] >= 1
