"""Seed the database with demo data."""

from app.models.user import User
from app.models.disaster import Disaster
from app.models.grid import Grid
from app.models.sos import SOSRequest
from app.ml.predictor import predict_priority


def seed_database(db) -> None:
    """Populate the database with demo users, disasters, grids, and SOS requests.

    Skips seeding if any user already exists.
    """

    if db.session.query(User).first() is not None:
        print("Database already seeded – skipping.")
        return

    # ══════════════════════════════════════════════════════════════════════
    # Users
    # ══════════════════════════════════════════════════════════════════════
    admin = User(name="Admin", email="admin@disaster.gov", role="admin")
    admin.set_password("admin123")

    dispatcher = User(name="Dispatcher", email="dispatch@disaster.gov", role="dispatcher")
    dispatcher.set_password("dispatch123")

    db.session.add_all([admin, dispatcher])

    # ══════════════════════════════════════════════════════════════════════
    # Disasters
    # ══════════════════════════════════════════════════════════════════════
    eq = Disaster(
        title="San Francisco Earthquake",
        disaster_type="earthquake",
        description="Major earthquake in the SF Bay Area",
        latitude=37.7749,
        longitude=-122.4194,
        severity=4,
        radius=15,
    )
    flood = Disaster(
        title="Houston Flood",
        disaster_type="flood",
        description="Severe flooding across Houston metro area",
        latitude=29.7604,
        longitude=-95.3698,
        severity=3,
        radius=25,
    )
    fire = Disaster(
        title="Los Angeles Wildfire",
        disaster_type="wildfire",
        description="Fast-spreading wildfire in the LA hills",
        latitude=34.0522,
        longitude=-118.2437,
        severity=5,
        radius=20,
    )
    db.session.add_all([eq, flood, fire])
    db.session.flush()  # so disaster IDs are available

    # ══════════════════════════════════════════════════════════════════════
    # Grids
    # ══════════════════════════════════════════════════════════════════════
    grids = [
        # San Francisco grids
        Grid(disaster_id=eq.id, grid_code="SF-A1", severity=4, population=12000, accessibility=3),
        Grid(disaster_id=eq.id, grid_code="SF-A2", severity=3, population=8000, accessibility=4),
        Grid(disaster_id=eq.id, grid_code="SF-B1", severity=5, population=20000, accessibility=2),
        Grid(disaster_id=eq.id, grid_code="SF-B2", severity=2, population=5000, accessibility=5),
        # Houston grids
        Grid(disaster_id=flood.id, grid_code="HOU-A1", severity=3, population=15000, accessibility=2),
        Grid(disaster_id=flood.id, grid_code="HOU-A2", severity=4, population=25000, accessibility=1),
        Grid(disaster_id=flood.id, grid_code="HOU-B1", severity=2, population=6000, accessibility=4),
        # LA grids
        Grid(disaster_id=fire.id, grid_code="LA-A1", severity=5, population=30000, accessibility=1),
        Grid(disaster_id=fire.id, grid_code="LA-A2", severity=4, population=18000, accessibility=3),
        Grid(disaster_id=fire.id, grid_code="LA-B1", severity=3, population=10000, accessibility=5),
        Grid(disaster_id=fire.id, grid_code="LA-B2", severity=5, population=22000, accessibility=2),
    ]
    db.session.add_all(grids)
    db.session.flush()

    # ══════════════════════════════════════════════════════════════════════
    # SOS Requests (near disaster locations)
    # ══════════════════════════════════════════════════════════════════════
    sos_list = [
        SOSRequest(name="John Doe", phone="415-555-0101", latitude=37.78, longitude=-122.42, message="Building collapsed, people trapped"),
        SOSRequest(name="Jane Smith", phone="713-555-0202", latitude=29.76, longitude=-95.37, message="Water rising fast, need evacuation"),
        SOSRequest(name="Carlos Garcia", phone="213-555-0303", latitude=34.05, longitude=-118.24, message="Fire approaching, elderly residents need help"),
        SOSRequest(name="Aisha Patel", phone="415-555-0404", latitude=37.77, longitude=-122.41, message="Medical emergency, roads blocked"),
    ]
    db.session.add_all(sos_list)

    # ══════════════════════════════════════════════════════════════════════
    # Run AI priority prediction on all grids
    # ══════════════════════════════════════════════════════════════════════
    for grid in grids:
        score = predict_priority(
            grid.severity or 3,
            grid.population or 1000,
            grid.accessibility or 3,
        )
        grid.ai_priority_score = round(score, 2)
        if score > 75:
            grid.risk_level = "critical"
        elif score > 50:
            grid.risk_level = "high"
        elif score > 25:
            grid.risk_level = "medium"
        else:
            grid.risk_level = "low"

    db.session.commit()

    print("""
============================================
  SEED DATA CREATED
  Admin:      admin@disaster.gov / admin123
  Dispatcher: dispatch@disaster.gov / dispatch123
  WARNING: Change these credentials before any real deployment!
============================================
""")
