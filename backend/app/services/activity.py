from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityLog


async def log_activity(
    db: AsyncSession,
    user_email: str,
    action: str,
    detail: str | None = None,
) -> None:
    """Log a user or admin action. Never raises — failures are silently ignored."""
    try:
        entry = ActivityLog(
            user_email=user_email,
            action=action,
            detail=detail,
        )
        db.add(entry)
        await db.commit()
    except Exception:
        await db.rollback()
