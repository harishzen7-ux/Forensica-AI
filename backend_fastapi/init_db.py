import logging
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine, Base
from app.models import user, upload, analysis # Import all models here

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db(db: Session) -> None:
    # Tables should be created with Alembic in production,
    # But we will use Base.metadata.create_all() for simplicity here.
    logger.info("Creating initial data")
    Base.metadata.create_all(bind=engine)
    logger.info("Initial data created")

def main() -> None:
    logger.info("Initializing database")
    db = SessionLocal()
    try:
        init_db(db)
    except Exception as e:
        logger.error(f"Error initializing DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
