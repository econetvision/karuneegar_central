"""
Integration tests for /api/scholarships endpoints.

Fixtures from conftest.py: app, client, clean_db (autouse),
seed_otp, registered_user, auth_headers, registered_user2, auth_headers2
"""


def _create_scholarship(client, auth_headers, type_="request", title="Need Help"):
    return client.post("/api/scholarships",
                       json={"type": type_, "title": title, "description": "Details here."},
                       headers=auth_headers)


# ── CREATE ────────────────────────────────────────────────────────────────────

def test_create_scholarship_request_success(client, registered_user, auth_headers):
    resp = _create_scholarship(client, auth_headers, type_="request", title="Engineering Grant")
    assert resp.status_code == 201
    s = resp.get_json()["scholarship"]
    assert s["type"] == "request"
    assert s["title"] == "Engineering Grant"


def test_create_scholarship_provide_success(client, registered_user, auth_headers):
    resp = _create_scholarship(client, auth_headers, type_="provide", title="Offering Scholarship")
    assert resp.status_code == 201
    assert resp.get_json()["scholarship"]["type"] == "provide"


def test_create_scholarship_invalid_type_returns_400(client, registered_user, auth_headers):
    resp = client.post("/api/scholarships",
                       json={"type": "grant", "title": "Bad Type"},
                       headers=auth_headers)
    assert resp.status_code == 400


def test_create_scholarship_unauthenticated_returns_401(client):
    resp = client.post("/api/scholarships", json={"type": "request", "title": "Anon"})
    assert resp.status_code == 401


# ── LIST ──────────────────────────────────────────────────────────────────────

def test_list_all_scholarships(client, registered_user, auth_headers):
    _create_scholarship(client, auth_headers, type_="request", title="S1")
    _create_scholarship(client, auth_headers, type_="provide", title="S2")

    resp = client.get("/api/scholarships")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "scholarships" in data
    assert data["total"] >= 2


def test_list_filter_by_type_request(client, registered_user, auth_headers):
    _create_scholarship(client, auth_headers, type_="request", title="Request One")
    _create_scholarship(client, auth_headers, type_="provide", title="Provide One")

    resp = client.get("/api/scholarships?type=request")
    assert resp.status_code == 200
    assert all(s["type"] == "request" for s in resp.get_json()["scholarships"])


def test_list_filter_by_type_provide(client, registered_user, auth_headers):
    _create_scholarship(client, auth_headers, type_="request", title="Request Two")
    _create_scholarship(client, auth_headers, type_="provide", title="Provide Two")

    resp = client.get("/api/scholarships?type=provide")
    assert resp.status_code == 200
    assert all(s["type"] == "provide" for s in resp.get_json()["scholarships"])


# ── GET SINGLE ────────────────────────────────────────────────────────────────

def test_get_scholarship_by_id(client, registered_user, auth_headers):
    sch_id = _create_scholarship(client, auth_headers).get_json()["scholarship"]["id"]

    resp = client.get(f"/api/scholarships/{sch_id}")
    assert resp.status_code == 200
    assert resp.get_json()["scholarship"]["id"] == sch_id


# ── UPDATE ────────────────────────────────────────────────────────────────────

def test_update_scholarship_by_owner(client, registered_user, auth_headers):
    sch_id = _create_scholarship(client, auth_headers).get_json()["scholarship"]["id"]

    resp = client.put(f"/api/scholarships/{sch_id}",
                      json={"title": "Updated Title"},
                      headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["scholarship"]["title"] == "Updated Title"


def test_update_scholarship_by_non_owner_returns_403(
        client, registered_user, auth_headers, registered_user2, auth_headers2):
    sch_id = _create_scholarship(client, auth_headers).get_json()["scholarship"]["id"]

    resp = client.put(f"/api/scholarships/{sch_id}",
                      json={"title": "Hijacked"},
                      headers=auth_headers2)
    assert resp.status_code == 403


# ── DELETE ────────────────────────────────────────────────────────────────────

def test_delete_scholarship_by_owner(client, registered_user, auth_headers):
    sch_id = _create_scholarship(client, auth_headers).get_json()["scholarship"]["id"]

    resp = client.delete(f"/api/scholarships/{sch_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json().get("ok") is True

    # Soft delete: record stays in DB with active=False; GET still returns 200
    get_after = client.get(f"/api/scholarships/{sch_id}")
    assert get_after.status_code == 200
    assert get_after.get_json()["scholarship"]["active"] is False


def test_delete_scholarship_by_non_owner_returns_403(
        client, registered_user, auth_headers, registered_user2, auth_headers2):
    sch_id = _create_scholarship(client, auth_headers).get_json()["scholarship"]["id"]

    resp = client.delete(f"/api/scholarships/{sch_id}", headers=auth_headers2)
    assert resp.status_code == 403
