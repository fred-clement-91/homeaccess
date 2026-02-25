from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SystemFlag(Base):
    __tablename__ = "system_flags"

    key: Mapped[str] = mapped_column(String(50), primary_key=True)
    value: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
