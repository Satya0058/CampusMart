"""
CampusMate Seed Data Module.
All demo user details and items have been completely removed.
The marketplace starts with a 100% clean database for actual campus students.
"""
from sqlalchemy.orm import Session

def seed_database(db: Session):
    """
    Clean database initializer. Demo accounts and items have been removed.
    """
    return {
        "status": "success",
        "message": "Database is clean. No demo accounts or mock items are seeded."
    }
