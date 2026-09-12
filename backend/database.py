from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from urllib.parse import quote_plus

DB_PASSWORD = "YOUR_ACTUAL_PASSWORD"

DATABASE_URL = (
    f"mysql+pymysql://root:{quote_plus('Madhuri@123')}@localhost/aivoa_qms"
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()