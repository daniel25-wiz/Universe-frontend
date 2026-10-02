from django.conf import settings
from django.core.mail import send_mail


def send_reset_code(email, code):
    minutes = settings.PASSWORD_RESET_CODE_TTL_MINUTES
    send_mail(
        subject="Your Universe password reset code",
        message=(
            f"Your verification code is {code}.\n\n"
            f"It expires in {minutes} minutes. If you did not request this, you can ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
