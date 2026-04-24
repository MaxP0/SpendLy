from sqlalchemy import Column, ForeignKey, Index, String, Text
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base, TimestampMixin


class Customer(TimestampMixin, Base):
    """Customer model."""
    __tablename__ = "customers"
    __table_args__ = (
        Index("ix_customers_user_id", "user_id"),
        Index("ix_customers_user_id_created_at", "user_id", "created_at"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)

    user = relationship("User", back_populates="customers")
    inquiries = relationship("Inquiry", back_populates="customer", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="customer", cascade="all, delete-orphan")
