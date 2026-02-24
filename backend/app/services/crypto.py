from cryptography.fernet import Fernet

from app.config import settings

_fernet = Fernet(settings.fernet_key.encode())


def encrypt_key(plaintext: str) -> str:
    return _fernet.encrypt(plaintext.encode()).decode()


def decrypt_key(ciphertext: str) -> str:
    return _fernet.decrypt(ciphertext.encode()).decode()
