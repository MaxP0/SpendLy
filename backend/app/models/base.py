from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


class BaseModel:
    """Base model with common fields for all entities."""
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
