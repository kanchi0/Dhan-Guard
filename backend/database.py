import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

# Read the values from the .env file into environment variables
load_dotenv()

# Build the database address safely (handles special characters in passwords)
DATABASE_URL = URL.create(
    drivername="postgresql+psycopg2",
    username=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=int(os.getenv("DB_PORT", "5432")),
    database=os.getenv("DB_NAME"),
)

# The engine is the connection to PostgreSQL
engine = create_engine(DATABASE_URL)

# A session is one "conversation" with the database
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# All table classes will inherit from this Base
Base = declarative_base()


def get_db():
    """Give a database session to an API request, then close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


if __name__ == "__main__":
    # Quick connection test: run with "python database.py"
    with engine.connect() as connection:
        version = connection.execute(text("SELECT version()")).scalar()
        print("Connected to PostgreSQL successfully!")
        print(version)