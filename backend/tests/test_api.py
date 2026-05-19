import pytest
import uuid as uuid_mod
from fastapi.testclient import TestClient
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app, get_db, SessionLocal

client = TestClient(app)

def override_get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

def unique_slug(base):
    return f"{base}-{uuid_mod.uuid4().hex[:8]}"

class TestHealth:
    def test_health_endpoint(self):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["service"] == "course-hub"
        assert "database" in data

class TestCourses:
    def test_list_courses_empty(self):
        resp = client.get("/api/courses")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_create_course(self):
        slug = unique_slug("test-course")
        resp = client.post("/api/courses", json={
            "title": "Test Course",
            "slug": slug,
            "url": "https://example.com/course",
            "status": "draft",
            "category": "Testing",
            "tokenExpiry": 3600,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "created"
        assert data["title"] == "Test Course"
        assert "id" in data

    def test_create_course_missing_fields(self):
        resp = client.post("/api/courses", json={"title": ""})
        assert resp.status_code == 400

    def test_update_course(self):
        slug = unique_slug("update-me")
        create = client.post("/api/courses", json={
            "title": "Update Me", "slug": slug,
            "url": "https://example.com/update", "status": "draft"
        }).json()
        resp = client.put(f"/api/courses/{create['id']}", json={"title": "Updated Title"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "updated"

    def test_delete_course(self):
        slug = unique_slug("delete-me")
        create = client.post("/api/courses", json={
            "title": "Delete Me", "slug": slug,
            "url": "https://example.com/delete", "status": "draft"
        }).json()
        resp = client.delete(f"/api/courses/{create['id']}")
        assert resp.status_code == 200
        assert resp.json()["status"] == "deleted"

    def test_toggle_status(self):
        slug = unique_slug("toggle-me")
        create = client.post("/api/courses", json={
            "title": "Toggle Me", "slug": slug,
            "url": "https://example.com/toggle", "status": "active"
        }).json()
        resp = client.patch(f"/api/courses/{create['id']}/status")
        assert resp.status_code == 200
        assert resp.json()["status"] == "draft"

class TestTokens:
    def test_list_tokens(self):
        resp = client.get("/api/tokens")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_create_token_no_course(self):
        resp = client.post("/api/tokens", json={"email": "test@test.com"})
        assert resp.status_code == 400

    def test_create_token_invalid_course(self):
        resp = client.post("/api/tokens", json={
            "email": "test@test.com",
            "courseId": "nonexistent"
        })
        assert resp.status_code == 404

    def test_create_and_revoke_token(self):
        slug = unique_slug("token-course")
        course = client.post("/api/courses", json={
            "title": "Token Course", "slug": slug,
            "url": "https://example.com/token", "status": "active",
            "secretKey": "test-secret-key"
        }).json()
        resp = client.post("/api/tokens", json={
            "email": "student@test.com",
            "name": "Test Student",
            "courseId": course["id"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert "jti" in data
        token_id = data["jti"]
        tokens = client.get("/api/tokens").json()
        token_obj = next((t for t in tokens if t["jti"] == token_id), None)
        assert token_obj is not None
        if token_obj:
            revoke = client.post(f"/api/tokens/{token_obj['id']}/revoke")
            assert revoke.status_code == 200
            assert revoke.json()["status"] == "revoked"

    def test_token_stats(self):
        resp = client.get("/api/tokens/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "active" in data

class TestActivity:
    def test_list_activity(self):
        resp = client.get("/api/activity")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_activity_stats(self):
        resp = client.get("/api/activity/stats")
        assert resp.status_code == 200

class TestUsers:
    def test_list_users(self):
        resp = client.get("/api/users")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

class TestPlans:
    def test_list_plans(self):
        resp = client.get("/api/plans")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

class TestDashboard:
    def test_dashboard_stats(self):
        resp = client.get("/api/dashboard/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "activeCourses" in data
        assert "activeUsers" in data
        assert "todayTokens" in data

class TestSeed:
    def test_seed_endpoint(self):
        resp = client.post("/api/seed")
        assert resp.status_code == 200
        data = resp.json()
        assert "plans" in data
        assert "admin" in data

class TestSync:
    def test_sync_no_config(self):
        resp = client.post("/api/sync/users")
        assert resp.status_code == 400
        assert "WordPress not configured" in resp.json()["detail"]
