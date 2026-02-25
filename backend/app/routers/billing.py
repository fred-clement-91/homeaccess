import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.config import settings
from app.dependencies import get_current_user
from app.models.user import User
from app.services.activity import log_activity

router = APIRouter()
stripe.api_key = settings.stripe_secret_key


class CheckoutRequest(BaseModel):
    amount: int = Field(..., ge=100, le=100000, description="Amount in cents (min 1€)")


@router.post("/checkout")
async def create_checkout_session(
    data: CheckoutRequest,
    user: User = Depends(get_current_user),
):
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Payments not configured")

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": "eur",
                    "unit_amount": data.amount,
                    "product_data": {
                        "name": "Soutien HomeAccess",
                        "description": "Contribution volontaire pour l'acquisition de matériel informatique",
                    },
                },
                "quantity": 1,
            }
        ],
        mode="payment",
        ui_mode="embedded",
        customer_email=user.email,
        metadata={"user_id": str(user.id), "user_email": user.email},
        return_url=f"https://{settings.domain}/dashboard?checkout=success",
    )

    return {"client_secret": session.client_secret}


@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        email = session.get("metadata", {}).get("user_email", "unknown")
        amount_total = session.get("amount_total", 0)
        amount_eur = f"{amount_total / 100:.2f}€"
        await log_activity(email, "donation", detail=amount_eur)

    return {"status": "ok"}
