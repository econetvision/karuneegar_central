"""
Integration tests for /api/forums endpoints.

Fixtures from conftest.py: app, client, clean_db (autouse),
seed_otp, registered_user, auth_headers, registered_user2,
auth_headers2, forum_category
"""


def _create_thread(client, auth_headers, cat_id, title="Test Thread", body="Thread body."):
    resp = client.post(f"/api/forums/categories/{cat_id}/threads",
                       json={"title": title, "body": body},
                       headers=auth_headers)
    return resp


# ── CATEGORIES ────────────────────────────────────────────────────────────────

def test_list_categories_returns_seeded_categories(client):
    resp = client.get("/api/forums/categories")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "categories" in data
    assert len(data["categories"]) >= 1


# ── THREADS ───────────────────────────────────────────────────────────────────

def test_list_threads_empty_initially(client, forum_category):
    resp = client.get(f"/api/forums/categories/{forum_category.id}/threads")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["threads"] == []


def test_create_thread_success(client, registered_user, auth_headers, forum_category):
    resp = _create_thread(client, auth_headers, forum_category.id)
    assert resp.status_code == 201
    assert resp.get_json()["thread"]["title"] == "Test Thread"


def test_create_thread_unauthenticated_returns_401(client, forum_category):
    resp = client.post(f"/api/forums/categories/{forum_category.id}/threads",
                       json={"title": "Ghost Thread", "body": "body"})
    assert resp.status_code == 401


def test_create_thread_missing_fields_returns_400(client, registered_user, auth_headers, forum_category):
    resp = client.post(f"/api/forums/categories/{forum_category.id}/threads",
                       json={"title": "No Body"},
                       headers=auth_headers)
    assert resp.status_code == 400


def test_list_threads_after_creation(client, registered_user, auth_headers, forum_category):
    _create_thread(client, auth_headers, forum_category.id, title="Listed Thread")

    resp = client.get(f"/api/forums/categories/{forum_category.id}/threads")
    assert resp.status_code == 200
    titles = [t["title"] for t in resp.get_json()["threads"]]
    assert "Listed Thread" in titles


def test_get_thread_increments_views(client, registered_user, auth_headers, forum_category):
    thread_id = _create_thread(client, auth_headers, forum_category.id).get_json()["thread"]["id"]

    client.get(f"/api/forums/threads/{thread_id}")
    resp = client.get(f"/api/forums/threads/{thread_id}")
    assert resp.status_code == 200
    assert resp.get_json()["thread"]["views"] >= 2


def test_delete_thread_by_owner(client, registered_user, auth_headers, forum_category):
    thread_id = _create_thread(client, auth_headers, forum_category.id).get_json()["thread"]["id"]

    resp = client.delete(f"/api/forums/threads/{thread_id}", headers=auth_headers)
    assert resp.status_code == 200

    assert client.get(f"/api/forums/threads/{thread_id}").status_code == 404


def test_delete_thread_by_non_owner_returns_403_or_404(
        client, registered_user, auth_headers, registered_user2, auth_headers2, forum_category):
    thread_id = _create_thread(client, auth_headers, forum_category.id).get_json()["thread"]["id"]

    resp = client.delete(f"/api/forums/threads/{thread_id}", headers=auth_headers2)
    assert resp.status_code in (403, 404)


# ── REPLIES ───────────────────────────────────────────────────────────────────

def test_reply_to_thread_success(client, registered_user, auth_headers, forum_category):
    thread_id = _create_thread(client, auth_headers, forum_category.id).get_json()["thread"]["id"]

    resp = client.post(f"/api/forums/threads/{thread_id}/replies",
                       json={"body": "Great post!"},
                       headers=auth_headers)
    assert resp.status_code == 201
    assert resp.get_json()["reply"]["body"] == "Great post!"


def test_reply_unauthenticated_returns_401(client, registered_user, auth_headers, forum_category):
    thread_id = _create_thread(client, auth_headers, forum_category.id).get_json()["thread"]["id"]

    resp = client.post(f"/api/forums/threads/{thread_id}/replies",
                       json={"body": "Anonymous reply"})
    assert resp.status_code == 401


def test_replies_included_in_thread_response(
        client, registered_user, auth_headers, registered_user2, auth_headers2, forum_category):
    thread_id = _create_thread(client, auth_headers, forum_category.id).get_json()["thread"]["id"]

    client.post(f"/api/forums/threads/{thread_id}/replies",
                json={"body": "Reply from user2"},
                headers=auth_headers2)

    resp = client.get(f"/api/forums/threads/{thread_id}")
    assert resp.status_code == 200
    thread = resp.get_json()["thread"]
    assert "replies" in thread
    bodies = [r["body"] for r in thread["replies"]]
    assert "Reply from user2" in bodies
