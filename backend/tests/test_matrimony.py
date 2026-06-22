"""
Integration tests for /api/matrimony endpoints.

Fixtures from conftest.py: app, client, clean_db (autouse),
seed_otp, registered_user, auth_headers, registered_user2,
auth_headers2, matrimony_profile, OTP_CODE
"""
from unittest.mock import patch, MagicMock


# ── CREATE ────────────────────────────────────────────────────────────────────

def test_create_matrimony_profile_success(client, registered_user, auth_headers):
    resp = client.post("/api/matrimony", json={
        "full_name": "Bride Test",
        "gender":    "female",
        "age":       25,
        "star":      "Ashwini",
        "raasi":     "Mesha",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["profile"]["full_name"] == "Bride Test"
    assert data["profile"]["gender"] == "female"


def test_create_duplicate_profile_returns_409(client, matrimony_profile, auth_headers):
    resp = client.post("/api/matrimony", json={
        "full_name": "Another Groom",
        "gender":    "male",
    }, headers=auth_headers)
    assert resp.status_code == 409


def test_create_profile_missing_required_fields_returns_400(client, registered_user, auth_headers):
    resp = client.post("/api/matrimony", json={"full_name": "No Gender"}, headers=auth_headers)
    assert resp.status_code == 400

    resp = client.post("/api/matrimony", json={"gender": "male"}, headers=auth_headers)
    assert resp.status_code == 400


def test_create_profile_unauthenticated_returns_401(client):
    resp = client.post("/api/matrimony", json={"full_name": "Ghost", "gender": "male"})
    assert resp.status_code == 401


# ── LIST ──────────────────────────────────────────────────────────────────────

def test_list_matrimony_profiles_public(client, matrimony_profile):
    resp = client.get("/api/matrimony")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "profiles" in data
    assert isinstance(data["profiles"], list)
    assert data["total"] >= 1


def test_list_matrimony_filter_by_gender(client, matrimony_profile, auth_headers2, registered_user2):
    # Create a female profile with user2
    client.post("/api/matrimony", json={
        "full_name": "Bride Filter",
        "gender":    "female",
    }, headers=auth_headers2)

    resp = client.get("/api/matrimony?gender=female")
    assert resp.status_code == 200
    assert all(p["gender"] == "female" for p in resp.get_json()["profiles"])

    resp = client.get("/api/matrimony?gender=male")
    assert resp.status_code == 200
    assert all(p["gender"] == "male" for p in resp.get_json()["profiles"])


# ── GET SINGLE ────────────────────────────────────────────────────────────────

def test_get_matrimony_profile_anonymous_hides_contact(client, registered_user, auth_headers):
    resp = client.post("/api/matrimony", json={
        "full_name":     "Contact Hidden",
        "gender":        "male",
        "contact_email": "secret@example.com",
        "contact_phone": "+919999999999",
    }, headers=auth_headers)
    assert resp.status_code == 201
    profile_id = resp.get_json()["profile"]["id"]

    resp = client.get(f"/api/matrimony/{profile_id}")
    assert resp.status_code == 200
    assert resp.get_json()["profile"]["contact_email"] is None


def test_get_matrimony_profile_authenticated_shows_contact(
        client, registered_user, auth_headers, auth_headers2, registered_user2):
    resp = client.post("/api/matrimony", json={
        "full_name":     "Contact Visible",
        "gender":        "male",
        "contact_email": "visible@example.com",
    }, headers=auth_headers)
    assert resp.status_code == 201
    profile_id = resp.get_json()["profile"]["id"]

    resp = client.get(f"/api/matrimony/{profile_id}", headers=auth_headers2)
    assert resp.status_code == 200
    assert resp.get_json()["profile"]["contact_email"] == "visible@example.com"


# ── UPDATE ────────────────────────────────────────────────────────────────────

def test_update_matrimony_profile_by_owner(client, matrimony_profile, auth_headers):
    profile_id = matrimony_profile["id"]
    resp = client.put(f"/api/matrimony/{profile_id}",
                      json={"occupation": "Software Engineer", "age": 29},
                      headers=auth_headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["profile"]["occupation"] == "Software Engineer"
    assert data["profile"]["age"] == 29


def test_update_matrimony_profile_by_non_owner_returns_404(
        client, matrimony_profile, auth_headers2, registered_user2):
    resp = client.put(f"/api/matrimony/{matrimony_profile['id']}",
                      json={"occupation": "Hacker"},
                      headers=auth_headers2)
    assert resp.status_code == 404


# ── DELETE ────────────────────────────────────────────────────────────────────

def test_delete_matrimony_profile_by_owner(client, matrimony_profile, auth_headers):
    profile_id = matrimony_profile["id"]
    resp = client.delete(f"/api/matrimony/{profile_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert client.get(f"/api/matrimony/{profile_id}").status_code == 404


def test_delete_matrimony_profile_by_non_owner_returns_404(
        client, matrimony_profile, auth_headers2, registered_user2):
    resp = client.delete(f"/api/matrimony/{matrimony_profile['id']}", headers=auth_headers2)
    assert resp.status_code == 404


# ── MINE ──────────────────────────────────────────────────────────────────────

def test_get_mine_returns_null_when_no_profile(client, registered_user, auth_headers):
    resp = client.get("/api/matrimony/mine", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["profile"] is None


def test_get_mine_returns_profile_when_exists(client, matrimony_profile, auth_headers):
    resp = client.get("/api/matrimony/mine", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["profile"] is not None
    assert data["profile"]["full_name"] == matrimony_profile["full_name"]


# ── PHOTOS ────────────────────────────────────────────────────────────────────

def test_photos_json_stored_and_returned(client, registered_user, auth_headers):
    photos = ["a.jpg", "b.jpg"]
    resp = client.post("/api/matrimony", json={
        "full_name": "Photo Test",
        "gender":    "male",
        "photos":    photos,
    }, headers=auth_headers)
    assert resp.status_code == 201

    resp = client.get("/api/matrimony/mine", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["profile"]["photos"] == photos


def test_photos_capped_at_5(client, registered_user, auth_headers):
    six_photos = ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg"]
    resp = client.post("/api/matrimony", json={
        "full_name": "Cap Test",
        "gender":    "male",
        "photos":    six_photos,
    }, headers=auth_headers)
    assert resp.status_code == 201

    resp = client.get("/api/matrimony/mine", headers=auth_headers)
    assert resp.status_code == 200
    photos = resp.get_json()["profile"]["photos"]
    assert len(photos) == 5
    assert photos == six_photos[:5]


# ── GENERATE HOROSCOPE ────────────────────────────────────────────────────────

def test_generate_horoscope_returns_text(client, matrimony_profile, auth_headers):
    profile_id = matrimony_profile["id"]

    mock_msg = MagicMock()
    mock_msg.content = [MagicMock(text="Mocked horoscope text")]
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_msg

    with patch("anthropic.Anthropic", return_value=mock_client):
        resp = client.post(
            f"/api/matrimony/{profile_id}/generate-horoscope?lang=ta",
            headers=auth_headers,
        )

    assert resp.status_code == 200
    data = resp.get_json()
    assert "horoscope" in data
    assert data["horoscope"] == "Mocked horoscope text"
    assert data["lang"] == "ta"


def test_generate_horoscope_invalid_lang_returns_400(client, matrimony_profile, auth_headers):
    resp = client.post(
        f"/api/matrimony/{matrimony_profile['id']}/generate-horoscope?lang=fr",
        headers=auth_headers,
    )
    assert resp.status_code == 400
