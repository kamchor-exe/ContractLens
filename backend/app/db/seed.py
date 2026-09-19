import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import User
from app.core.config import settings

logger = logging.getLogger(__name__)

async def seed_demo_user(db: AsyncSession) -> User:
    """Ensure the single demo user exists in the database."""
    stmt = select(User).where(User.email == settings.DEMO_USER_EMAIL)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        logger.info(f"Seeding demo user: {settings.DEMO_USER_NAME} ({settings.DEMO_USER_EMAIL})")
        user = User(
            email=settings.DEMO_USER_EMAIL,
            name=settings.DEMO_USER_NAME
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    return user
