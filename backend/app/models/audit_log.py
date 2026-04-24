from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, JSON, Index
from datetime import datetime
import uuid
import enum
from app.models.base import Base


class AuditAction(str, enum.Enum):
    """Audit action enumeration."""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


class AuditLog(Base):
    """Audit log model."""
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_user_id", "user_id"),
        Index("ix_audit_logs_table_name", "table_name"),
        Index("ix_audit_logs_record_id", "record_id"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    table_name = Column(String(100), nullable=False)
    record_id = Column(String(36), nullable=False)
    
    action = Column(SQLEnum(AuditAction), nullable=False)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
