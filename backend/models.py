from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base, engine


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    predictions = relationship("Prediction", back_populates="user")


class Disease(Base):
    __tablename__ = "diseases"

    id = Column(Integer, primary_key=True, index=True)
    # Must match class_names.json exactly (for example "Leaf scald")
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    symptoms = Column(Text)
    cause = Column(Text)

    treatments = relationship("Treatment", back_populates="disease")
    predictions = relationship("Prediction", back_populates="disease")


class Treatment(Base):
    __tablename__ = "treatments"

    id = Column(Integer, primary_key=True, index=True)
    disease_id = Column(Integer, ForeignKey("diseases.id"), nullable=False)
    # One of: preventive, chemical, organic
    type = Column(String(20), nullable=False)
    recommendation = Column(Text, nullable=False)

    disease = relationship("Disease", back_populates="treatments")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    # Nullable so a prediction can exist without a logged-in user
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    image_path = Column(String(500), nullable=False)
    disease_id = Column(Integer, ForeignKey("diseases.id"), nullable=False)
    confidence = Column(Float, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="predictions")
    disease = relationship("Disease", back_populates="predictions")


if __name__ == "__main__":
    # Create any tables that do not exist yet (safe to run more than once)
    Base.metadata.create_all(bind=engine)
    print("Tables created: users, diseases, treatments, predictions")