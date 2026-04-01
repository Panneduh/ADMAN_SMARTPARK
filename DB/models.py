# models.py
# This file defines the database tables (ORM models) for spots, current spot state, and history events.

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, Boolean  # SQL columns/types/indexes.
from sqlalchemy.sql import func  # SQL functions like NOW() for timestamps.
from sqlalchemy.orm import relationship  # ORM relationship helpers.
from DB.db import Base  # Import the shared Base class.

class Spot(Base):
    __tablename__ = "spots"  # The table name in the database.

    id = Column(Integer, primary_key=True, index=True)  # Primary key id with index.
    label = Column(String, unique=True, index=True, nullable=False)  # Unique human label like "U1".
    cluster = Column(String, index=True, nullable=False)  # Cluster/group name like "upper_center".
    is_handicapped = Column(Boolean, default=False, nullable=False)  # Whether this spot is handicapped.

    x1 = Column(Float, nullable=False)  # Bounding box left x.
    y1 = Column(Float, nullable=False)  # Bounding box top y.
    x2 = Column(Float, nullable=False)  # Bounding box right x.
    y2 = Column(Float, nullable=False)  # Bounding box bottom y.

    # One-to-one relationship: Spot -> SpotState (current state row).
    state = relationship(
        "SpotState",               # Target model name as a string.
        back_populates="spot",     # Matches SpotState.spot relationship name.
        uselist=False,             # One-to-one (not a list).
        cascade="all, delete-orphan"  # Delete state row if spot is deleted.
    )

    # One-to-many relationship: Spot -> SpotEvent (history).
    events = relationship(
        "SpotEvent",               # Target model.
        back_populates="spot",     # Matches SpotEvent.spot relationship.
        cascade="all, delete-orphan"  # Delete events if spot is deleted.
    )


class SpotState(Base):
    __tablename__ = "spot_state"  # Table name for “current state”.

    spot_id = Column(Integer, ForeignKey("spots.id"), primary_key=True)  # PK + FK to spots.id.

    status = Column(String, nullable=False)  # "empty" | "occupied" | "unknown".
    confidence = Column(Float, nullable=True)  # Optional ML confidence (0.0 to 1.0).

    # Auto-managed timestamp: default is now; updates automatically on row update.
    last_update = Column(
        DateTime(timezone=True),      # Timestamp with timezone support.
        server_default=func.now(),    # Default to NOW() at insert time.
        onupdate=func.now(),          # Update to NOW() whenever row changes.
        nullable=False                # Must always have a timestamp.
    )

    # Relationship back to Spot (one-to-one).
    spot = relationship(
        "Spot",                  # Target model.
        back_populates="state"   # Matches Spot.state.
    )

    # Index to speed queries like “show me all empty spots”.
    __table_args__ = (
        Index("ix_spot_state_status", "status"),
    )


class SpotEvent(Base):
    __tablename__ = "spot_events"  # Table name for event history.

    id = Column(Integer, primary_key=True, index=True)  # Unique event id.
    spot_id = Column(Integer, ForeignKey("spots.id"), index=True, nullable=False)  # FK to spots.

    new_status = Column(String, nullable=False)  # The status that was written.
    confidence = Column(Float, nullable=True)  # Optional confidence at the time.
    created_at = Column(
        DateTime(timezone=True),    # Timestamp with timezone support.
        server_default=func.now(),  # Default to NOW() at insert time.
        nullable=False              # Must exist.
    )

    # Relationship back to Spot (many events per spot).
    spot = relationship(
        "Spot",                  # Target model.
        back_populates="events"  # Matches Spot.events.
    )
