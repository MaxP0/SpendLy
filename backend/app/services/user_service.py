from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repo import UserRepository
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
import uuid


class UserService:
    """Service for user-related business logic."""
    
    def __init__(self, db: AsyncSession):
        self.repository = UserRepository(db)
        self.db = db
    
    async def register_user(
        self,
        email: str,
        password: str,
        role: str,
        business_name: str = None,
        business_address: str = None,
    ) -> User:
        """Register a new user."""
        existing_user = await self.repository.get_by_email(email)
        if existing_user:
            raise ValueError("User with this email already exists")
        
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            hashed_password=hash_password(password),
            role=role,
            business_name=business_name,
            business_address=business_address,
        )
        return await self.repository.create(user)
    
    async def authenticate_user(self, email: str, password: str) -> dict:
        """Authenticate a user and return access token."""
        user = await self.repository.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password")
        
        access_token = create_access_token(user.id, user.email)
        return {
            "access_token": access_token,
            "user_id": user.id,
        }
    
    async def get_user(self, user_id: str) -> User:
        """Get user by ID."""
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        return user
