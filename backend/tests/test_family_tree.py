"""
Integration tests for /api/family-tree endpoints.

Fixtures from conftest.py: app, client, clean_db (autouse),
seed_otp, registered_user, auth_headers, registered_user2, auth_headers2
"""


def _create_member(client, auth_headers, name="Father", relation="father", gender="male"):
    return client.post("/api/family-tree",
                       json={"name": name, "relation": relation, "gender": gender},
                       headers=auth_headers)


# ── CREATE ────────────────────────────────────────────────────────────────────

def test_create_family_member_success(client, registered_user, auth_headers):
    resp = _create_member(client, auth_headers)
    assert resp.status_code == 201
    assert resp.get_json()["member"]["name"] == "Father"


def test_create_family_member_unauthenticated_returns_401(client):
    resp = client.post("/api/family-tree", json={"name": "Ghost"})
    assert resp.status_code == 401


# ── LIST ──────────────────────────────────────────────────────────────────────

def test_list_family_members_empty_initially(client, registered_user, auth_headers):
    resp = client.get("/api/family-tree", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["members"] == []


def test_list_family_members_after_creation(client, registered_user, auth_headers):
    _create_member(client, auth_headers, name="Mother", relation="mother")

    resp = client.get("/api/family-tree", headers=auth_headers)
    assert resp.status_code == 200
    names = [m["name"] for m in resp.get_json()["members"]]
    assert "Mother" in names


# ── UPDATE ────────────────────────────────────────────────────────────────────

def test_update_family_member_by_owner(client, registered_user, auth_headers):
    member_id = _create_member(client, auth_headers).get_json()["member"]["id"]

    resp = client.put(f"/api/family-tree/{member_id}",
                      json={"name": "Updated Father", "birth_year": 1960},
                      headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["member"]["name"] == "Updated Father"


def test_update_family_member_by_non_owner_returns_404(
        client, registered_user, auth_headers, registered_user2, auth_headers2):
    member_id = _create_member(client, auth_headers).get_json()["member"]["id"]

    resp = client.put(f"/api/family-tree/{member_id}",
                      json={"name": "Hijacked"},
                      headers=auth_headers2)
    assert resp.status_code == 404


# ── DELETE ────────────────────────────────────────────────────────────────────

def test_delete_family_member_by_owner(client, registered_user, auth_headers):
    member_id = _create_member(client, auth_headers).get_json()["member"]["id"]

    resp = client.delete(f"/api/family-tree/{member_id}", headers=auth_headers)
    assert resp.status_code == 200

    members = client.get("/api/family-tree", headers=auth_headers).get_json()["members"]
    assert not any(m["id"] == member_id for m in members)


def test_delete_family_member_by_non_owner_returns_404(
        client, registered_user, auth_headers, registered_user2, auth_headers2):
    member_id = _create_member(client, auth_headers).get_json()["member"]["id"]

    resp = client.delete(f"/api/family-tree/{member_id}", headers=auth_headers2)
    assert resp.status_code == 404


# ── ISOLATION ─────────────────────────────────────────────────────────────────

def test_family_tree_isolation(
        client, registered_user, auth_headers, registered_user2, auth_headers2):
    """User1 cannot see User2's family members."""
    _create_member(client, auth_headers2, name="User2 Father")

    resp = client.get("/api/family-tree", headers=auth_headers)
    assert resp.status_code == 200
    names = [m["name"] for m in resp.get_json()["members"]]
    assert "User2 Father" not in names


# ── PARENT/CHILD ──────────────────────────────────────────────────────────────

def test_create_member_with_parent(client, registered_user, auth_headers):
    parent_id = _create_member(client, auth_headers, name="Dad").get_json()["member"]["id"]

    resp = client.post("/api/family-tree",
                       json={"name": "Son", "relation": "self", "gender": "male", "parent_id": parent_id},
                       headers=auth_headers)
    assert resp.status_code == 201
    member = resp.get_json()["member"]
    assert member["parent_id"] == parent_id
