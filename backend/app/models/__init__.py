"""Import every model so SQLAlchemy registers the tables."""

from app.models.user import User  # noqa: F401
from app.models.disaster import Disaster  # noqa: F401
from app.models.grid import Grid  # noqa: F401
from app.models.assignment import Assignment  # noqa: F401
from app.models.sos import SOSRequest  # noqa: F401
