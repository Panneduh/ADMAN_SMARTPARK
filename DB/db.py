# This file sets up the SQLAlchemy engine, session factory, and Base class.

from sqlalchemy import create_engine  # Imports SQLAlchemy engine creator (connects to DB).
from sqlalchemy.orm import sessionmaker, declarative_base  # Session factory + declarative Base.
import os  # Lets us read environment variables (optional DB URL override).

# Read DATABASE_URL if set; otherwise default to a local SQLite file named parking.db.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./parking.db")

# SQLite needs this flag when used with FastAPI (multiple threads can access DB).
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Create the database engine (the core DB connection object SQLAlchemy uses).
engine = create_engine(
    DATABASE_URL,              # The connection string (SQLite file, Postgres URL, etc.).
    connect_args=connect_args  # Extra args (needed for SQLite thread safety).
)

# Create a session factory (each request will get its own Session object).
SessionLocal = sessionmaker(
    autocommit=False,  # We control when commits happen.
    autoflush=False,   # We control when changes flush to DB.
    bind=engine        # Bind sessions to our engine.
)

# Base class for all SQLAlchemy ORM models (Spot, SpotState, SpotEvent).
Base = declarative_base()
