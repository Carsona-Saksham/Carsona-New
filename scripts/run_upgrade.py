"""One-off helper to widen interaction_events.session_id in production.

Instead of relying on Alembic (which needs a running Flask context),
we directly execute the ALTER TABLE via SQLAlchemy using the DATABASE_URL
that Railway injects into the environment.
"""

import os
import sys
from sqlalchemy import create_engine, text

def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL environment variable not set")
        sys.exit(1)

    # Railway still provides the old postgres:// prefix – SQLAlchemy expects postgresql://
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    engine = create_engine(db_url, pool_pre_ping=True)

    stmt = text(
        "ALTER TABLE interaction_events "
        "ALTER COLUMN session_id TYPE varchar(255);"
    )

    try:
        with engine.begin() as conn:
            conn.execute(stmt)
        print("✅ Column altered to varchar(255)")
    except Exception as exc:
        print(f"⚠️ Migration failed: {exc}")
        sys.exit(1)

if __name__ == "__main__":
    main() 