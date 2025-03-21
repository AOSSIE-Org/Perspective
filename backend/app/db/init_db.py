from .database import engine
from .models import Base

def init_db():
    """Initialize the database by creating all tables."""
    Base.metadata.create_all(bind=engine) 