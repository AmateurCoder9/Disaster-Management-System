"""ML prediction endpoint tests."""


def _create_disaster_and_grid(client, admin_headers, severity=4, population=15000, accessibility=2):
    """Helper – creates a disaster + grid, returns grid id."""
    d = client.post("/disasters", json={
        "title": "Pred Test",
        "disaster_type": "earthquake",
        "latitude": 37.0,
        "longitude": -122.0,
        "severity": 4,
        "radius": 10,
    }, headers=admin_headers)
    did = d.get_json()["id"]

    g = client.post("/grids", json={
        "disaster_id": did,
        "grid_code": f"PT-{severity}{accessibility}",
        "severity": severity,
        "population": population,
        "accessibility": accessibility,
    }, headers=admin_headers)
    return g.get_json()["id"]


def test_predict_priority_returns_score(client, admin_headers):
    gid = _create_disaster_and_grid(client, admin_headers)

    resp = client.post("/predict-priority", json={"grid_id": gid}, headers=admin_headers)
    assert resp.status_code == 200
    grid_data = resp.get_json()["grid"]
    score = grid_data["ai_priority_score"]
    assert 1 <= score <= 100
    assert grid_data["risk_level"] in ("critical", "high", "medium", "low")


def test_predict_different_grids_different_scores(client, admin_headers):
    # Low-risk grid
    gid_low = _create_disaster_and_grid(client, admin_headers, severity=1, population=200, accessibility=5)
    # High-risk grid
    gid_high = _create_disaster_and_grid(client, admin_headers, severity=5, population=40000, accessibility=1)

    r1 = client.post("/predict-priority", json={"grid_id": gid_low}, headers=admin_headers)
    r2 = client.post("/predict-priority", json={"grid_id": gid_high}, headers=admin_headers)

    score_low = r1.get_json()["grid"]["ai_priority_score"]
    score_high = r2.get_json()["grid"]["ai_priority_score"]

    assert score_high > score_low, f"Expected high ({score_high}) > low ({score_low})"


def test_batch_predict(client, admin_headers):
    gid1 = _create_disaster_and_grid(client, admin_headers, severity=3, population=10000, accessibility=3)
    gid2 = _create_disaster_and_grid(client, admin_headers, severity=5, population=30000, accessibility=1)

    resp = client.post("/predict-priority", json={"grid_ids": [gid1, gid2]}, headers=admin_headers)
    assert resp.status_code == 200
    grids = resp.get_json()["grids"]
    assert len(grids) == 2
    assert all("ai_priority_score" in g for g in grids)
