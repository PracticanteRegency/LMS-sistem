from django.core.mail import send_mail
from django.conf import settings
from django.core.mail import EmailMultiAlternatives


def enviar_notificacion_email(destinatario, asunto, mensaje):
    send_mail(
        subject=asunto,
        message=mensaje,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[destinatario],
        fail_silently=False
    )
