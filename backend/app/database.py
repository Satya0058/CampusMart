import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database path for CampusMate
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "campusmate.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def migrate_db():
    """
    Ensure newly added columns exist in the SQLite items table without data loss.
    """
    import sqlite3
    if not os.path.exists(DB_PATH):
        return
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(items)")
        existing_cols = {row[1] for row in cursor.fetchall()}

        new_columns = [
            ("ai_decision", "TEXT DEFAULT 'PENDING'"),
            ("ai_confidence", "REAL"),
            ("ai_risk_level", "TEXT"),
            ("ai_reason", "TEXT"),
            ("ai_scanned_at", "DATETIME")
        ]

        for col_name, col_type in new_columns:
            if col_name not in existing_cols:
                cursor.execute(f"ALTER TABLE items ADD COLUMN {col_name} {col_type}")

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[DB Migration Warning] {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

