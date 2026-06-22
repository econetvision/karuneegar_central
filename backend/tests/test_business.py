"""
Integration tests for /api/business and /api/business/<id>/ads endpoints.

Fixtures from conftest.py: app, client, clean_db (autouse),
seed_otp, registered_user, auth_headers, registered_user2,
auth_headers2, business
"""


# ── CREATE BUSINESS ───────────────────────────────────────────────────────────

def test_create_business_success(client, registered_user, auth_headers):
    resp = client.post("/api/business", json={
        "company_name": "Test Co",
        "category":     "Retail",
        "city":         "Madurai",
    }, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.get_json()["business"]["company_name"] == "Test Co"


def test_create_duplicate_business_returns_409(client, business, auth_headers):
    resp = client.post("/api/business", json={"company_name": "Second Biz"}, headers=auth_headers)
    assert resp.status_code == 409


def test_create_business_missing_company_name_returns_400(client, registered_user, auth_headers):
    resp = client.post("/api/business", json={"category": "IT"}, headers=auth_headers)
    assert resp.status_code == 400


def test_create_business_unauthenticated_returns_401(client):
    resp = client.post("/api/business", json={"company_name": "No Auth Corp"})
    assert resp.status_code == 401


# ── LIST BUSINESSES ───────────────────────────────────────────────────────────

def test_list_businesses_public(client, business):
    resp = client.get("/api/business")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "businesses" in data
    assert isinstance(data["businesses"], list)
    assert data["total"] >= 1


def test_list_businesses_search_by_name(client, business):
    resp = client.get("/api/business?q=Acme")
    assert resp.status_code == 200
    assert any(b["company_name"] == "Acme Corp" for b in resp.get_json()["businesses"])

    resp = client.get("/api/business?q=zzznomatchzzz")
    assert resp.status_code == 200
    assert resp.get_json()["total"] == 0


# ── GET SINGLE ────────────────────────────────────────────────────────────────

def test_get_business_by_id(client, business):
    resp = client.get(f"/api/business/{business['id']}")
    assert resp.status_code == 200
    assert resp.get_json()["business"]["company_name"] == "Acme Corp"


# ── MINE ──────────────────────────────────────────────────────────────────────

def test_get_mine_returns_null_when_no_business(client, registered_user, auth_headers):
    resp = client.get("/api/business/mine", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["business"] is None


def test_get_mine_returns_business_when_exists(client, business, auth_headers):
    resp = client.get("/api/business/mine", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["business"]["company_name"] == "Acme Corp"


# ── UPDATE BUSINESS ───────────────────────────────────────────────────────────

def test_update_business_by_owner(client, business, auth_headers):
    bp_id = business["id"]
    resp = client.put(f"/api/business/{bp_id}", json={"city": "Coimbatore"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["business"]["city"] == "Coimbatore"


def test_update_business_by_non_owner_returns_404(client, business, auth_headers2, registered_user2):
    resp = client.put(f"/api/business/{business['id']}",
                      json={"city": "Attacker City"},
                      headers=auth_headers2)
    assert resp.status_code == 404


# ── DELETE BUSINESS ───────────────────────────────────────────────────────────

def test_delete_business_by_owner(client, business, auth_headers):
    bp_id = business["id"]
    resp = client.delete(f"/api/business/{bp_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert client.get(f"/api/business/{bp_id}").status_code == 404


def test_delete_business_by_non_owner_returns_404(client, business, auth_headers2, registered_user2):
    resp = client.delete(f"/api/business/{business['id']}", headers=auth_headers2)
    assert resp.status_code == 404


# ── ADS — CREATE ──────────────────────────────────────────────────────────────

def test_create_ad_success(client, business, auth_headers):
    bp_id = business["id"]
    resp = client.post(f"/api/business/{bp_id}/ads", json={
        "photo_filename": "promo.jpg",
        "title":          "Grand Sale",
        "caption":        "Up to 50% off",
    }, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.get_json()["ad"]["photo_filename"] == "promo.jpg"


def test_create_ad_missing_photo_returns_400(client, business, auth_headers):
    bp_id = business["id"]
    resp = client.post(f"/api/business/{bp_id}/ads",
                       json={"title": "No Photo"},
                       headers=auth_headers)
    assert resp.status_code == 400


def test_create_ad_by_non_owner_returns_404(client, business, auth_headers2, registered_user2):
    bp_id = business["id"]
    resp = client.post(f"/api/business/{bp_id}/ads",
                       json={"photo_filename": "hack.jpg"},
                       headers=auth_headers2)
    assert resp.status_code == 404


# ── ADS — LIST ────────────────────────────────────────────────────────────────

def test_list_ads_returns_active_ads(client, business, auth_headers):
    bp_id = business["id"]
    r1 = client.post(f"/api/business/{bp_id}/ads",
                     json={"photo_filename": "active.jpg"},
                     headers=auth_headers)
    r2 = client.post(f"/api/business/{bp_id}/ads",
                     json={"photo_filename": "also_active.jpg"},
                     headers=auth_headers)
    assert r1.status_code == 201
    assert r2.status_code == 201

    resp = client.get(f"/api/business/{bp_id}/ads", headers=auth_headers)
    assert resp.status_code == 200
    ads = resp.get_json()["ads"]
    assert len(ads) == 2
    assert all(a["active"] for a in ads)


# ── ADS — UPDATE ──────────────────────────────────────────────────────────────

def test_update_ad_title(client, business, auth_headers):
    bp_id = business["id"]
    ad_id = client.post(
        f"/api/business/{bp_id}/ads",
        json={"photo_filename": "update_me.jpg", "title": "Old Title"},
        headers=auth_headers,
    ).get_json()["ad"]["id"]

    resp = client.put(f"/api/business/{bp_id}/ads/{ad_id}",
                      json={"title": "New Title"},
                      headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["ad"]["title"] == "New Title"


# ── ADS — DELETE ──────────────────────────────────────────────────────────────

def test_delete_ad_by_owner(client, business, auth_headers):
    bp_id = business["id"]
    ad_id = client.post(
        f"/api/business/{bp_id}/ads",
        json={"photo_filename": "delete_me.jpg"},
        headers=auth_headers,
    ).get_json()["ad"]["id"]

    resp = client.delete(f"/api/business/{bp_id}/ads/{ad_id}", headers=auth_headers)
    assert resp.status_code == 200

    ads = client.get(f"/api/business/{bp_id}/ads", headers=auth_headers).get_json()["ads"]
    assert not any(a["id"] == ad_id for a in ads)


def test_delete_ad_by_non_owner_returns_404(client, business, auth_headers, auth_headers2, registered_user2):
    bp_id = business["id"]
    ad_id = client.post(
        f"/api/business/{bp_id}/ads",
        json={"photo_filename": "victim.jpg"},
        headers=auth_headers,
    ).get_json()["ad"]["id"]

    resp = client.delete(f"/api/business/{bp_id}/ads/{ad_id}", headers=auth_headers2)
    assert resp.status_code == 404


def test_deactivated_ad_not_in_list(client, business, auth_headers):
    bp_id = business["id"]
    ad_id = client.post(
        f"/api/business/{bp_id}/ads",
        json={"photo_filename": "soon_inactive.jpg"},
        headers=auth_headers,
    ).get_json()["ad"]["id"]

    resp = client.put(f"/api/business/{bp_id}/ads/{ad_id}",
                      json={"active": False},
                      headers=auth_headers)
    assert resp.status_code == 200
    assert resp.get_json()["ad"]["active"] is False

    ads = client.get(f"/api/business/{bp_id}/ads", headers=auth_headers).get_json()["ads"]
    assert ads == []
