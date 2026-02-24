from app.database import async_session
from app.models.activity_log import ActivityLog


async def log_activity(
    user_email: str,
    action: str,
    detail: str | None = None,
) -> None:
    """Log a user or admin action using its own session.

    Uses a dedicated session so failures never affect the caller's transaction.
    Never raises — errors are silently ignored.
    """
    try:
        async with async_session() as session:
            entry = ActivityLog(
                user_email=user_email,
                action=action,
                detail=detail,
            )
            session.add(entry)
            await session.commit()
    except Exception:
        pass
