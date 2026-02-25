import random
import secrets
import smtplib
import string
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email import encoders

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


def send_new_user_notification(user_email: str) -> None:
    """Notify admin that a new user has registered."""
    to_email = settings.contact_email
    if not to_email:
        return  # silently ignore if not configured

    html = f"""\
    <html>
    <body style="font-family: 'Inter', sans-serif; background-color: #0a0a0f; color: #e5e7eb; padding: 40px;">
        <div style="max-width: 480px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px;">
            <h2 style="color: #818cf8; margin-top: 0;">Nouvelle inscription</h2>
            <p>Un nouvel utilisateur vient de s'inscrire sur HomeAccess :</p>
            <div style="background: #1f2937; border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0;">
                <span style="font-size: 18px; font-weight: bold; color: #a5b4fc;">{user_email}</span>
            </div>
        </div>
    </body>
    </html>
    """
    text = f"Nouvelle inscription HomeAccess : {user_email}"
    _send_email(to_email, f"[HomeAccess] Nouvelle inscription : {user_email}", html, text)


def send_tunnel_created_email(
    to_email: str,
    subdomain: str,
    full_domain: str,
    vpn_ip: str,
    device_ip: str,
    target_port: int,
    config_text: str,
) -> None:
    """Send tunnel creation email with WireGuard config attached."""
    url = f"https://{full_domain}"
    docs_url = f"https://{settings.domain}/docs"
    dashboard_url = f"https://{settings.domain}/dashboard"

    html = f"""\
    <html>
    <body style="font-family: 'Inter', sans-serif; background-color: #0a0a0f; color: #e5e7eb; padding: 40px;">
        <div style="max-width: 520px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px;">
            <h1 style="color: #818cf8; margin-top: 0;">HomeAccess</h1>
            <p>Votre tunnel <strong style="color: #a5b4fc;">{subdomain}</strong> est pret !</p>

            <div style="background: #1f2937; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <table style="width: 100%; font-size: 14px; color: #d1d5db;">
                    <tr><td style="padding: 4px 0; color: #9ca3af;">URL</td><td style="padding: 4px 0;"><a href="{url}" style="color: #818cf8;">{full_domain}</a></td></tr>
                    <tr><td style="padding: 4px 0; color: #9ca3af;">Port cible</td><td style="padding: 4px 0;">{target_port}</td></tr>
                    <tr><td style="padding: 4px 0; color: #9ca3af;">IP VPN</td><td style="padding: 4px 0;">{vpn_ip}</td></tr>
                    <tr><td style="padding: 4px 0; color: #9ca3af;">IP Device</td><td style="padding: 4px 0; color: #34d399; font-weight: bold;">{device_ip}</td></tr>
                </table>
            </div>

            <h3 style="color: #e5e7eb; margin-bottom: 8px;">Pour demarrer</h3>
            <ol style="color: #d1d5db; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                <li>Installez la config WireGuard jointe sur votre routeur (Pi, GL.iNet, MikroTik…) ou directement sur l'equipement s'il supporte WireGuard.</li>
                <li>Assignez l'adresse <strong style="color: #34d399;">{device_ip}</strong> a votre equipement cible.</li>
                <li>Verifiez la connexion dans le <a href="{dashboard_url}" style="color: #818cf8;">Dashboard</a>.</li>
            </ol>

            <p style="margin-top: 24px; font-size: 14px;">
                <a href="{docs_url}" style="color: #818cf8;">Consultez la documentation complete</a>
                pour un guide detaille.
            </p>

            <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
                Le fichier de configuration WireGuard est en piece jointe.
                Il contient une cle privee unique — ne le partagez pas.
            </p>
        </div>
    </body>
    </html>
    """

    text = (
        f"Votre tunnel HomeAccess '{subdomain}' est pret !\n\n"
        f"URL : {url}\n"
        f"Port cible : {target_port}\n"
        f"IP VPN : {vpn_ip}\n"
        f"IP Device : {device_ip}\n\n"
        f"Pour demarrer :\n"
        f"1. Installez la config WireGuard jointe sur votre routeur ou equipement.\n"
        f"2. Assignez l'adresse {device_ip} a votre equipement cible.\n"
        f"3. Verifiez la connexion dans le Dashboard : {dashboard_url}\n\n"
        f"Documentation complete : {docs_url}\n\n"
        f"Le fichier de configuration WireGuard est en piece jointe.\n"
        f"Il contient une cle privee unique — ne le partagez pas."
    )

    # Build message with attachment
    msg = MIMEMultipart("mixed")
    msg["Subject"] = f"HomeAccess - Tunnel {subdomain} pret"
    msg["From"] = settings.smtp_from
    msg["To"] = to_email

    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(text, "plain"))
    alt.attach(MIMEText(html, "html"))
    msg.attach(alt)

    # Attach WireGuard config file
    part = MIMEBase("application", "octet-stream")
    part.set_payload(config_text.encode())
    encoders.encode_base64(part)
    part.add_header(
        "Content-Disposition",
        f'attachment; filename="homevpn-{subdomain}.conf"',
    )
    msg.attach(part)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        if settings.smtp_tls:
            server.starttls()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from, to_email, msg.as_string())


def send_contact_email(
    from_email: str,
    subject: str,
    message: str,
    attachments: list[tuple[str, bytes]] | None = None,
) -> None:
    """Send a contact form message to the admin. Attachments: list of (filename, content)."""
    to_email = settings.contact_email
    if not to_email:
        raise RuntimeError("CONTACT_EMAIL not configured")

    msg = MIMEMultipart("mixed")
    msg["Subject"] = f"[HomeAccess] {subject}"
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg["Reply-To"] = from_email

    body_html = f"""\
    <html>
    <body style="font-family: 'Inter', sans-serif; background-color: #0a0a0f; color: #e5e7eb; padding: 40px;">
        <div style="max-width: 600px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px;">
            <h2 style="color: #818cf8; margin-top: 0;">Nouveau message</h2>
            <p style="color: #9ca3af; font-size: 14px;">De : <strong style="color: #e5e7eb;">{from_email}</strong></p>
            <p style="color: #9ca3af; font-size: 14px;">Sujet : <strong style="color: #e5e7eb;">{subject}</strong></p>
            <hr style="border: none; border-top: 1px solid #1f2937; margin: 24px 0;" />
            <div style="white-space: pre-wrap; line-height: 1.6;">{message}</div>
        </div>
    </body>
    </html>
    """
    body_text = f"De : {from_email}\nSujet : {subject}\n\n{message}"

    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(body_text, "plain"))
    alt.attach(MIMEText(body_html, "html"))
    msg.attach(alt)

    if attachments:
        for filename, content in attachments:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(content)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f'attachment; filename="{filename}"')
            msg.attach(part)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        if settings.smtp_tls:
            server.starttls()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from, to_email, msg.as_string())
