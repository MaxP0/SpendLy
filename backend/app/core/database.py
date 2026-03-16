from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    create_async_engine,
)
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from .config import get_settings

settings = get_settings()


class DatabaseManager:
    """Manages database connection and session creation."""
    
    _engine: AsyncEngine = None
    _async_session_maker = None
    
    @classmethod
    def initialize(cls) -> None:
        """Initialize the database engine and session factory."""
        cls._engine = create_async_engine(
            settings.DATABASE_URL,
            echo=settings.ENVIRONMENT == "development",
            future=True,
            poolclass=NullPool,
        )
        cls._async_session_maker = sessionmaker(
            cls._engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    
    @classmethod
    def get_session_maker(self):
        """Get the async session maker."""
        if self._async_session_maker is None:
            self.initialize()
        return self._async_session_maker
    
    @classmethod
    async def close(cls) -> None:
        """Close the database engine."""
        if cls._engine is not None:
            await cls._engine.dispose()


async def get_db() -> AsyncSession:
    """Dependency injection for database sessions."""
    session_maker = DatabaseManager.get_session_maker()
    async with session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
