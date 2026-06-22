"""
Load test: simulates N concurrent community members.

Install:  pip install locust faker
Run:      locust -f locustfile.py --host=http://localhost:5000 --users=10 --spawn-rate=2 --headless --run-time=60s
Web UI:   locust -f locustfile.py --host=http://localhost:5000
          then open http://localhost:8089 and set Users=10, Spawn rate=2
"""
import json
import random
import string
from locust import HttpUser, task, between
from faker import Faker

fake = Faker("en_IN")

OTP_MOCK = "123456"          # works when MOCK_SMS=true on the server


def _rand_suffix(n=6):
    return "".join(random.choices(string.digits, k=n))


class CommunityUser(HttpUser):
    """Simulates a registered community member browsing and contributing."""

    wait_time = between(0.5, 2)   # seconds between tasks

    # ── lifecycle ──────────────────────────────────────────────────────────────

    def on_start(self):
        """Register a fresh user at the start of each simulated session."""
        suffix     = _rand_suffix()
        self.uname = f"locust{suffix}"
        self.email = f"locust{suffix}@loadtest.local"
        self.mob   = f"+9198765{suffix}"
        self.pwd   = "LoadTest@1"
        self.token = None

        # seed OTP (requires MOCK_SMS=true; server auto-accepts OTP_MOCK)
        self.client.post("/api/auth/send-otp", json={"mobile": self.mob},
                         name="/api/auth/send-otp")

        resp = self.client.post("/api/auth/register", json={
            "username":  self.uname,
            "email":     self.email,
            "password":  self.pwd,
            "mobile":    self.mob,
            "otp_code":  OTP_MOCK,
            "full_name": fake.name(),
        }, name="/api/auth/register")

        if resp.status_code == 201:
            self.token = resp.json().get("token")
        else:
            # Registration failed (e.g. duplicate) — try login instead
            login = self.client.post("/api/auth/login",
                                     json={"email": self.email, "password": self.pwd},
                                     name="/api/auth/login [fallback]")
            if login.status_code == 200:
                self.token = login.json().get("token")

        self._headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        self._business_id = None
        self._matrimony_id = None
        self._thread_id    = None

    # ── read-heavy tasks (higher weight) ──────────────────────────────────────

    @task(5)
    def browse_members(self):
        self.client.get("/api/members?page=1", name="/api/members")

    @task(5)
    def browse_matrimony(self):
        self.client.get("/api/matrimony?page=1", name="/api/matrimony")

    @task(4)
    def browse_businesses(self):
        self.client.get("/api/business?page=1", name="/api/business")

    @task(4)
    def browse_forums(self):
        resp = self.client.get("/api/forums/categories", name="/api/forums/categories")
        if resp.status_code == 200:
            cats = resp.json().get("categories", [])
            if cats:
                cat_id = random.choice(cats)["id"]
                self.client.get(f"/api/forums/categories/{cat_id}/threads",
                                name="/api/forums/categories/[id]/threads")

    @task(3)
    def browse_scholarships(self):
        self.client.get("/api/scholarships?page=1", name="/api/scholarships")

    @task(2)
    def view_stats(self):
        self.client.get("/api/stats", name="/api/stats")

    @task(1)
    def health_check(self):
        self.client.get("/api/health", name="/api/health")

    # ── authenticated write tasks (lower weight) ──────────────────────────────

    @task(2)
    def view_own_profile(self):
        if self.token:
            self.client.get("/api/profile", headers=self._headers, name="/api/profile")

    @task(1)
    def create_matrimony_profile(self):
        if not self.token or self._matrimony_id:
            return
        resp = self.client.post("/api/matrimony", headers=self._headers, json={
            "full_name": fake.name(),
            "gender":    random.choice(["male", "female"]),
            "age":       random.randint(22, 40),
            "star":      random.choice(["Rohini", "Ashwini", "Krittika", "Mrigashira"]),
            "raasi":     random.choice(["Mesha", "Vrishabha", "Mithuna"]),
            "occupation": fake.job(),
            "native_place": fake.city(),
        }, name="/api/matrimony [POST]")
        if resp.status_code == 201:
            self._matrimony_id = resp.json()["profile"]["id"]

    @task(1)
    def create_business(self):
        if not self.token or self._business_id:
            return
        resp = self.client.post("/api/business", headers=self._headers, json={
            "company_name": f"{fake.company()} {_rand_suffix(3)}",
            "category":     random.choice(["IT & Technology", "Retail & Trading", "Healthcare & Medical"]),
            "city":         fake.city(),
        }, name="/api/business [POST]")
        if resp.status_code == 201:
            self._business_id = resp.json()["business"]["id"]

    @task(1)
    def post_forum_thread(self):
        if not self.token or self._thread_id:
            return
        resp = self.client.get("/api/forums/categories", name="/api/forums/categories [for thread]")
        if resp.status_code != 200:
            return
        cats = resp.json().get("categories", [])
        if not cats:
            return
        cat_id = random.choice(cats)["id"]
        t = self.client.post(f"/api/forums/categories/{cat_id}/threads",
                             headers=self._headers, json={
                                 "title": fake.sentence(nb_words=6),
                                 "body":  fake.paragraph(nb_sentences=3),
                             }, name="/api/forums/threads [POST]")
        if t.status_code == 201:
            self._thread_id = t.json()["thread"]["id"]

    @task(2)
    def post_forum_reply(self):
        if not self.token or not self._thread_id:
            return
        self.client.post(f"/api/forums/threads/{self._thread_id}/replies",
                         headers=self._headers,
                         json={"body": fake.sentence()},
                         name="/api/forums/replies [POST]")
