import random
import secrets
import smtplib
import string
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings


def generate_verification_code() -> str:
    return "".join(random.choices(string.digits, k=6))


def generate_password(length: int = 12) -> str:
    """Generate a random password with letters, digits, and symbols."""
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    while True:
        password = "".join(secrets.choice(alphabet) for _ in range(length))
        # Ensure at least one of each type
        if (
            any(c in string.ascii_lowercase for c in password)
            and any(c in string.ascii_uppercase for c in password)
            and any(c in string.digits for c in password)
            and any(c in "!@#$%&*" for c in password)
        ):
            return password


def _send_email(to_email: str, subject: str, html: str, text: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        if settings.smtp_tls:
            server.starttls()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from, to_email, msg.as_string())


def send_verification_email(to_email: str, code: str, password: str) -> None:
    html = f"""\
    <html>
    <body style="font-family: 'Inter', sans-serif; background-color: #0a0a0f; color: #e5e7eb; padding: 40px;">
        <div style="max-width: 480px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px;">
            <h1 style="color: #818cf8; margin-top: 0;">HomeAccess</h1>
            <p>Bienvenue ! Voici votre code de verification :</p>
            <div style="background: #1f2937; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #a5b4fc;">{code}</span>
            </div>
            <p style="color: #9ca3af; font-size: 14px;">Ce code expire dans 15 minutes.</p>
            <hr style="border: none; border-top: 1px solid #1f2937; margin: 24px 0;" />
            <p>Votre mot de passe :</p>
            <div style="background: #1f2937; border-radius: 12px; padding: 16px; text-align: center; margin: 16px 0;">
                <code style="font-size: 18px; font-weight: bold; color: #34d399; letter-spacing: 2px;">{password}</code>
            </div>
            <p style="color: #9ca3af; font-size: 14px;">Conservez ce mot de passe. Vous en aurez besoin pour vous connecter.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Si vous n'avez pas cree de compte HomeAccess, ignorez cet email.</p>
        </div>
    </body>
    </html>
    """

    text = (
        f"Votre code de verification HomeAccess : {code}\n"
        f"Ce code expire dans 15 minutes.\n\n"
        f"Votre mot de passe : {password}\n"
        f"Conservez ce mot de passe. Vous en aurez besoin pour vous connecter."
    )

    _send_email(to_email, f"HomeAccess - Code de verification : {code}", html, text)


def send_new_password_email(to_email: str, password: str) -> None:
    html = f"""\
    <html>
    <body style="font-family: 'Inter', sans-serif; background-color: #0a0a0f; color: #e5e7eb; padding: 40px;">
        <div style="max-width: 480px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px;">
            <h1 style="color: #818cf8; margin-top: 0;">HomeAccess</h1>
            <p>Votre mot de passe a ete reinitialise. Voici votre nouveau mot de passe :</p>
            <div style="background: #1f2937; border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0;">
                <code style="font-size: 18px; font-weight: bold; color: #34d399; letter-spacing: 2px;">{password}</code>
            </div>
            <p style="color: #9ca3af; font-size: 14px;">Vous pouvez maintenant vous connecter avec ce mot de passe.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Si vous n'avez pas demande de reinitialisation, contactez-nous.</p>
        </div>
    </body>
    </html>
    """

    text = (
        f"Votre mot de passe HomeAccess a ete reinitialise.\n\n"
        f"Nouveau mot de passe : {password}\n\n"
        f"Vous pouvez maintenant vous connecter avec ce mot de passe."
    )

    _send_email(to_email, "HomeAccess - Nouveau mot de passe", html, text)
