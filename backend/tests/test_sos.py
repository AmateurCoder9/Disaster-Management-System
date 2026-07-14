"""SOS endpoint tests."""


def test_sos_public_submit(client):
    """POST /sos requires no auth."""
    resp = client.post("/sos", json={
        "name": "Jane Doe",
        "phone": "555-1234",
        "latitude": 37.78,
        "longitude": -122.41,
        "message": "Need help!",
    })
    assert resp.status_code == 201
    assert "message" in resp.get_json()


def test_sos_response_no_pii(client):
    """Public SOS response must NOT contain name or phone."""
    resp = client.post("/sos", json={
        "name": "Secret Person",
        "phone": "555-9999",
        "latitude": 37.78,
        "longitude": -122.41,
        "message": "Help",
    })
    data = resp.get_json()
    sos_data = data.get("sos", {})
    assert "name" not in sos_data, "PII 'name' leaked in public response"
    assert "phone" not in sos_data, "PII 'phone' leaked in public response"


def test_sos_get_requires_auth(client):
    """GET /sos without auth returns 401."""
    resp = client.get("/sos")
    assert resp.status_code == 401


def test_sos_get_with_auth_has_details(client, auth_headers):
    """GET /sos with auth returns full details including name/phone."""
    # Submit one SOS first
    client.post("/sos", json={
        "name": "Visible Person",
        "phone": "555-0000",
        "latitude": 37.78,
        "longitude": -122.41,
        "message": "Details test",
    })
    resp = client.get("/sos", headers=auth_headers)
    assert resp.status_code == 200
    records = resp.get_json()
    assert len(records) >= 1
    assert "name" in records[0]
    assert "phone" in records[0]
