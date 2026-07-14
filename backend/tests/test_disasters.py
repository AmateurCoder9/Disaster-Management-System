"""Disaster endpoint tests."""

SAMPLE_DISASTER = {
    "title": "Test Earthquake",
    "disaster_type": "earthquake",
    "description": "A test disaster",
    "latitude": 37.77,
    "longitude": -122.42,
    "severity": 4,
    "radius": 10,
}


def test_create_disaster_admin(client, admin_headers):
    resp = client.post("/disasters", json=SAMPLE_DISASTER, headers=admin_headers)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["title"] == "Test Earthquake"
    assert data["severity"] == 4


def test_create_disaster_forbidden_dispatcher(client, auth_headers):
    """Dispatchers cannot create disasters."""
    resp = client.post("/disasters", json=SAMPLE_DISASTER, headers=auth_headers)
    assert resp.status_code == 403


def test_get_disasters(client, admin_headers, auth_headers):
    # Admin creates
    client.post("/disasters", json=SAMPLE_DISASTER, headers=admin_headers)
    # Dispatcher lists
    resp = client.get("/disasters", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.get_json()) >= 1


def test_update_disaster(client, admin_headers):
    resp = client.post("/disasters", json=SAMPLE_DISASTER, headers=admin_headers)
    did = resp.get_json()["id"]

    resp = client.put(
        f"/disasters/{did}",
        json={"severity": 5, "status": "resolved"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.get_json()["severity"] == 5
    assert resp.get_json()["status"] == "resolved"


def test_delete_disaster_admin_only(client, admin_headers, auth_headers):
    resp = client.post("/disasters", json=SAMPLE_DISASTER, headers=admin_headers)
    did = resp.get_json()["id"]

    # Dispatcher cannot delete
    resp = client.delete(f"/disasters/{did}", headers=auth_headers)
    assert resp.status_code == 403

    # Admin can delete
    resp = client.delete(f"/disasters/{did}", headers=admin_headers)
    assert resp.status_code == 200
