"""Auth endpoint tests."""


def test_register_success(client):
    resp = client.post("/auth/register", json={
        "name": "New User",
        "email": "new@example.com",
        "password": "password123",
        "role": "dispatcher",
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert "token" in data
    assert data["user"]["email"] == "new@example.com"
    assert data["user"]["role"] == "dispatcher"
    # password_hash must never leak
    assert "password_hash" not in data["user"]


def test_register_duplicate_email(client):
    client.post("/auth/register", json={
        "name": "First",
        "email": "dup@example.com",
        "password": "pass1",
        "role": "dispatcher",
    })
    resp = client.post("/auth/register", json={
        "name": "Second",
        "email": "dup@example.com",
        "password": "pass2",
        "role": "dispatcher",
    })
    assert resp.status_code == 409
    assert "already registered" in resp.get_json()["error"].lower()


def test_login_success(client):
    client.post("/auth/register", json={
        "name": "Login User",
        "email": "login@example.com",
        "password": "secret",
        "role": "dispatcher",
    })
    resp = client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "secret",
    })
    assert resp.status_code == 200
    assert "token" in resp.get_json()


def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "name": "WP User",
        "email": "wp@example.com",
        "password": "correct",
        "role": "dispatcher",
    })
    resp = client.post("/auth/login", json={
        "email": "wp@example.com",
        "password": "wrong",
    })
    assert resp.status_code == 401


def test_protected_route_no_token(client):
    resp = client.get("/disasters")
    assert resp.status_code == 401
