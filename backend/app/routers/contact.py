from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.email import send_contact_email

router = APIRouter()

MAX_FILE_SIZE = 1_000_000  # 1 MB
MAX_FILES = 3


@router.post("/", status_code=status.HTTP_204_NO_CONTENT)
async def contact(
    subject: str = Form(..., min_length=1, max_length=200),
    message: str = Form(..., min_length=1, max_length=5000),
    files: list[UploadFile] = File(default=[]),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a contact message to the admin."""
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_FILES} fichiers autorisés",
        )

    attachments: list[tuple[str, bytes]] = []
    for f in files:
        content = await f.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le fichier « {f.filename} » dépasse 1 Mo",
            )
        attachments.append((f.filename or "fichier", content))

    try:
        send_contact_email(
            from_email=user.email,
            subject=subject,
            message=message,
            attachments=attachments if attachments else None,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Service de contact indisponible",
        ) from exc

    return None
