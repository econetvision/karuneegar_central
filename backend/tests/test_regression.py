"""
Regression / end-to-end tests: full user journeys spanning multiple features.

Fixtures from conftest.py: app, client, clean_db (autouse),
seed_otp, registered_user, auth_headers, registered_user2, auth_headers2,
forum_category, OTP_CODE
"""
from unittest.mock import patch, MagicMock


# ── Full registration → login → profile flow ──────────────────────────────────

def test_full_registration_login_profile_flow(client, registered_user, auth_headers):
    # Login returns a token
    login = client.post("/api/auth/login", json={
        "email":    "user1@example.com",
        "password": "password123",
    })
    assert login.status_code == 200
    token = login.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # /api/auth/me works
    me = client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.get_json()["user"]["username"] == "user1"

    # Update profile
    upd = client.put("/api/profile",
                     json={"full_name": "Full Name Updated", "bio": "Bio text", "is_public": True},
                     headers=headers)
    assert upd.status_code == 200

    # Public profile reflects the update
    pub = client.get("/api/users/user1")
    assert pub.status_code == 200
    assert pub.get_json()["user"]["full_name"] == "Full Name Updated"


# ── Full matrimony CRUD flow ───────────────────────────────────────────────────

def test_full_matrimony_create_view_delete_flow(client, registered_user, auth_headers):
    # Create
    create = client.post("/api/matrimony", json={
        "full_name":     "Regression Groom",
        "gender":        "male",
        "age":           30,
        "occupation":    "Architect",
        "contact_email": "regress@example.com",
        "photos":        ["p1.jpg"],
    }, headers=auth_headers)
    assert create.status_code == 201
    profile_id = create.get_json()["profile"]["id"]

    # Appears in list
    lst = client.get("/api/matrimony")
    assert any(p["id"] == profile_id for p in lst.get_json()["profiles"])

    # Authenticated GET shows contact
    get_auth = client.get(f"/api/matrimony/{profile_id}", headers=auth_headers)
    assert get_auth.status_code == 200
    assert get_auth.get_json()["profile"]["contact_email"] == "regress@example.com"

    # Update occupation
    upd = client.put(f"/api/matrimony/{profile_id}",
                     json={"occupation": "Senior Architect"},
                     headers=auth_headers)
    assert upd.status_code == 200

    # Mine reflects update
    mine = client.get("/api/matrimony/mine", headers=auth_headers)
    assert mine.get_json()["profile"]["occupation"] == "Senior Architect"

    # Delete
    del_resp = client.delete(f"/api/matrimony/{profile_id}", headers=auth_headers)
    assert del_resp.status_code == 200

    # Mine is now null
    mine2 = client.get("/api/matrimony/mine", headers=auth_headers)
    assert mine2.get_json()["profile"] is None


# ── Full business → ads flow ──────────────────────────────────────────────────

def test_full_business_create_ad_flow(client, registered_user, auth_headers):
    # Create business
    biz = client.post("/api/business", json={
        "company_name": "Regression Corp",
        "category":     "IT & Technology",
        "city":         "Bangalore",
    }, headers=auth_headers)
    assert biz.status_code == 201
    biz_id = biz.get_json()["business"]["id"]

    # Mine exists
    mine = client.get("/api/business/mine", headers=auth_headers)
    assert mine.get_json()["business"]["company_name"] == "Regression Corp"

    # Create ad
    ad = client.post(f"/api/business/{biz_id}/ads", json={
        "photo_filename": "ad_promo.jpg",
        "title":          "Big Sale",
    }, headers=auth_headers)
    assert ad.status_code == 201
    ad_id = ad.get_json()["ad"]["id"]

    # Ad in list
    ads_list = client.get(f"/api/business/{biz_id}/ads", headers=auth_headers)
    assert any(a["id"] == ad_id for a in ads_list.get_json()["ads"])

    # Update ad
    upd = client.put(f"/api/business/{biz_id}/ads/{ad_id}",
                     json={"title": "Bigger Sale"},
                     headers=auth_headers)
    assert upd.status_code == 200
    assert upd.get_json()["ad"]["title"] == "Bigger Sale"

    # Delete ad
    del_ad = client.delete(f"/api/business/{biz_id}/ads/{ad_id}", headers=auth_headers)
    assert del_ad.status_code == 200

    # Empty ads list
    ads_empty = client.get(f"/api/business/{biz_id}/ads", headers=auth_headers)
    assert ads_empty.get_json()["ads"] == []


# ── Full forum thread + reply flow ────────────────────────────────────────────

def test_full_forum_thread_reply_flow(
        client, registered_user, auth_headers, registered_user2, auth_headers2, forum_category):
    # User1 creates thread
    thread = client.post(
        f"/api/forums/categories/{forum_category.id}/threads",
        json={"title": "Regression Thread", "body": "Starting the discussion."},
        headers=auth_headers,
    )
    assert thread.status_code == 201
    thread_id = thread.get_json()["thread"]["id"]

    # User2 replies
    reply = client.post(
        f"/api/forums/threads/{thread_id}/replies",
        json={"body": "User2's reply"},
        headers=auth_headers2,
    )
    assert reply.status_code == 201

    # Thread has 1 reply
    get_thread = client.get(f"/api/forums/threads/{thread_id}")
    assert get_thread.status_code == 200
    t = get_thread.get_json()["thread"]
    assert any(r["body"] == "User2's reply" for r in t["replies"])

    # User1 deletes thread
    del_thread = client.delete(f"/api/forums/threads/{thread_id}", headers=auth_headers)
    assert del_thread.status_code == 200

    # Thread is gone
    assert client.get(f"/api/forums/threads/{thread_id}").status_code == 404


# ── Ownership protection across features ─────────────────────────────────────

def test_ownership_protection_across_features(
        client, registered_user, auth_headers, registered_user2, auth_headers2, forum_category):
    # User1 creates resources
    mat_id = client.post("/api/matrimony",
                         json={"full_name": "Ownership Test", "gender": "male"},
                         headers=auth_headers).get_json()["profile"]["id"]

    biz_id = client.post("/api/business",
                         json={"company_name": "Ownership Corp"},
                         headers=auth_headers).get_json()["business"]["id"]

    thr_id = client.post(
        f"/api/forums/categories/{forum_category.id}/threads",
        json={"title": "Ownership Thread", "body": "body"},
        headers=auth_headers,
    ).get_json()["thread"]["id"]

    # User2 cannot modify any of them
    assert client.put(f"/api/matrimony/{mat_id}",
                      json={"occupation": "Hacker"},
                      headers=auth_headers2).status_code == 404

    assert client.delete(f"/api/business/{biz_id}",
                         headers=auth_headers2).status_code == 404

    assert client.delete(f"/api/forums/threads/{thr_id}",
                         headers=auth_headers2).status_code in (403, 404)


# ── Unique-constraint violations ──────────────────────────────────────────────

def test_concurrent_unique_constraint_violation(client, registered_user, auth_headers):
    # First matrimony profile OK
    r1 = client.post("/api/matrimony",
                     json={"full_name": "Unique User", "gender": "male"},
                     headers=auth_headers)
    assert r1.status_code == 201

    # Second matrimony profile → 409
    r2 = client.post("/api/matrimony",
                     json={"full_name": "Duplicate Matrimony", "gender": "male"},
                     headers=auth_headers)
    assert r2.status_code == 409

    # First business OK
    r3 = client.post("/api/business",
                     json={"company_name": "Unique Corp"},
                     headers=auth_headers)
    assert r3.status_code == 201

    # Second business → 409
    r4 = client.post("/api/business",
                     json={"company_name": "Duplicate Corp"},
                     headers=auth_headers)
    assert r4.status_code == 409
