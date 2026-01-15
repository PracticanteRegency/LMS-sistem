from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from capacitaciones.models import progresoCapacitaciones, Capacitaciones


@shared_task
def enviar_correo_capacitaciones_activas():
    """
    Envía un solo correo masivo a todos los colaboradores inscritos
    en capacitaciones que inician hoy (se ejecuta automáticamente cada día).
    """
    hoy = timezone.now().date()

    capacitaciones_activas = Capacitaciones.objects.filter(fecha_inicio__date=hoy)

    for cap in capacitaciones_activas:
        correos = list(
            progresoCapacitaciones.objects.filter(capacitacion=cap)
            .values_list("colaborador__correocolaborador", flat=True)
            .exclude(colaborador__correocolaborador__isnull=True)
            .exclude(colaborador__correocolaborador__exact="")
            .distinct()
        )

        if not correos:
            continue

        subject = f"🎓 Nueva Capacitación Activa: {cap.titulo}"

        text_message = (
            f"Estimado colaborador@,\n\n"
            f"Reciba un cordial saludo.\n"
            f"Nos complace informarle que ha sido matriculado en la formación '{cap.titulo}'.\n\n"
            f"Fecha de inicio: {cap.fecha_inicio.date()}\n"
            f"Fecha de finalización: {cap.fecha_fin.date()}\n\n"
            f"Podrá acceder a la plataforma en el siguiente enlace: [enlace a la plataforma]\n\n"
            f"Agradecemos su disposición e interés en fortalecer sus competencias.\n"
            f"Atentamente,\n\n"
            f"Área de Formación Empresarial"
        )

        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <p>Estimado colaborador,</p>
            <p>Reciba un cordial saludo.</p>
            <p>
                Nos complace informarle que ha sido matriculado en la formación
                <strong>{cap.titulo}</strong>. A continuación, encontrará los detalles:
            </p>
            <ul>
                <li><strong>Fecha de inicio:</strong> {cap.fecha_inicio.date()}</li>
                <li><strong>Fecha de finalización:</strong> {cap.fecha_fin.date()}</li>
            </ul>
            <p>
                Podrá acceder a la plataforma de formación a través del siguiente enlace:<br>
                <a href="https://tu-plataforma.com" target="_blank">Acceder a la plataforma</a>
            </p>
            <p>
                Si olvidó su contraseña, puede restablecerla desde la plataforma.
            </p>
            <p>
                Agradecemos su disposición e interés en fortalecer sus competencias.<br>
                Le deseamos una experiencia de aprendizaje provechosa.
            </p>
            <p><strong>Atentamente,</strong><br>
            Área de Formación Empresarial</p>
        </body>
        </html>
        """

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[],
            bcc=correos,
        )
        email.attach_alternative(html_message, "text/html")
        email.send(fail_silently=False)


@shared_task
def notificar_capacitacion_por_vencer_7_dias():
    hoy = timezone.now().date()
    fecha_objetivo = hoy + timedelta(days=7)

    capacitaciones = Capacitaciones.objects.filter(
        fecha_fin__date=fecha_objetivo
    )

    for cap in capacitaciones:

        pendientes = progresoCapacitaciones.objects.filter(
            capacitacion=cap,
            completada=False
        ).select_related("colaborador")

        correos = [
            p.colaborador.correocolaborador
            for p in pendientes
            if p.colaborador.correocolaborador
        ]

        if not correos:
            continue

        subject = f"⚠️ Capacitación próxima a finalizar: {cap.titulo}"

        text_message = f"""
            Estimado colaborador,

            Le recordamos que la capacitación "{cap.titulo}" finalizará en 7 días.

            Fecha de finalización: {cap.fecha_fin.date()}

            Según nuestros registros, aún no ha completado esta formación.

            Lo invitamos a ingresAR a la plataforma y finalizarla lo antes posible.

            Atentamente,
            Área de Formación Empresarial
"""

        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <p>Estimado colaborador,</p>
            <p>
                La capacitación <strong>{cap.titulo}</strong> se encuentra próxima a finalizar.
            </p>
            <ul>
                <li><strong>Fecha de finalización:</strong> {cap.fecha_fin.date()}</li>
                <li><strong>Estado:</strong> No completada</li>
            </ul>
            <p>
                Le recomendamos ingresar a la plataforma para completar sus actividades:
                <br>
                <a href="https://tu-plataforma.com" target="_blank">Ir a la plataforma</a>
            </p>
            <p>
                <strong>Quedan solo 7 días.</strong>
            </p>
            <p>
                Atentamente,<br>
                Área de Formación Empresarial
            </p>
        </body>
        </html>
        """

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[],
            bcc=correos
        )

        email.attach_alternative(html_message, "text/html")
        email.send(fail_silently=False)

@shared_task
def desactivar_capacitaciones():
    hoy = timezone.now().date()

    capacitaciones_a_desactivar = Capacitaciones.objects.filter(
        fecha_fin__date=hoy,
        estado_capacitacion=1
    )

    for cap in capacitaciones_a_desactivar:
        cap.estado_capacitacion = 0
        cap.save()

@shared_task
def activar_capacitaciones():
    hoy = timezone.now().date()

    capacitaciones_a_activar = Capacitaciones.objects.filter(
        fecha_inicio__date=hoy,
        estado_capacitacion=0
    )

    for cap in capacitaciones_a_activar:
        cap.estado_capacitacion = 1
        cap.save()

@shared_task
def notificar_capacitacion_por_vencer_1_dia():
    hoy = timezone.now().date()
    fecha_objetivo = hoy + timedelta(days=1)

    capacitaciones = Capacitaciones.objects.filter(
        fecha_fin__date=fecha_objetivo
    )

    for cap in capacitaciones:

        pendientes = progresoCapacitaciones.objects.filter(
            capacitacion=cap,
            completada=False
        ).select_related("colaborador")

        correos = [
            p.colaborador.correocolaborador
            for p in pendientes
            if p.colaborador.correocolaborador
        ]

        if not correos:
            continue

        subject = f"🚨 Último aviso: {cap.titulo} vence mañana"

        text_message = f"""
            Estimado colaborador,

            Le informamos que mañana finaliza la capacitación "{cap.titulo}".

            Aún aparece como NO completada en el sistema.

            Fecha de finalización: {cap.fecha_fin.date()}

            Le recomendamos completarla hoy mismo para evitar quedar como pendiente.

            Atentamente,
            Área de Formación Empresarial
            """

        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <p>Estimado colaborador,</p>
            <p>
                La capacitación <strong>{cap.titulo}</strong> finaliza <strong>mañana</strong>.
            </p>
            <ul>
                <li><strong>Fecha de finalización:</strong> {cap.fecha_fin.date()}</li>
                <li><strong>Estado:</strong> Aún no completada</li>
            </ul>
            <p>
                Este es el <strong>último recordatorio</strong>.
            </p>
            <p>
                Acceda aquí y finalice su capacitación:
                <br>
                <a href="https://tu-plataforma.com" target="_blank">Ir a la plataforma</a>
            </p>
            <p>
                Área de Formación Empresarial
            </p>
        </body>
        </html>
        """

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[],
            bcc=correos
        )

        email.attach_alternative(html_message, "text/html")
        email.send(fail_silently=False)


@shared_task
def notificar_jefes_por_colaboradores_sin_progreso():
    hoy = timezone.now().date()

    registros = (
        progresoCapacitaciones.objects
        .select_related(
            "capacitacion",
            "colaborador",
            "colaborador__centroOP__id_proyecto__encargado_proyecto"
        )
        .filter(
            capacitacion__estado=1,
            completada=False,
            progreso=0
        )
    )

    notificaciones = {}

    for r in registros:
        colaborador = r.colaborador
        centro = colaborador.centroOP

        if not centro:
            continue

        proyecto = centro.id_proyecto
        if not proyecto:
            continue

        jefe = proyecto.encargado_proyecto
        if not jefe or not jefe.correocolaborador:
            continue

        email_jefe = jefe.correocolaborador

        if email_jefe not in notificaciones:
            notificaciones[email_jefe] = {
                "jefe": jefe,
                "proyecto": proyecto,
                "items": []
            }

        notificaciones[email_jefe]["items"].append({
            "colaborador": f"{colaborador.nombre_colaborador} {colaborador.apellido_colaborador}",
            "capacitacion": r.capacitacion.titulo
        })

    # 🚨 Envío de correos
    for email, data in notificaciones.items():
        jefe = data["jefe"]
        proyecto = data["proyecto"]
        items = data["items"]

        listado_html = "".join(
            f"<li>{i['colaborador']} – <strong>{i['capacitacion']}</strong></li>"
            for i in items
        )

        subject = f"⚠️ Colaboradores sin avance - Proyecto {proyecto.nombre_proyecto}"

        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <p>Estimado(a) {jefe.nombre_colaborador},</p>

            <p>
                Se identificaron los siguientes colaboradores del proyecto
                <strong>{proyecto.nombre_proyecto}</strong>
                que no presentan avance en las capacitaciones asignadas:
            </p>

            <ul>
                {listado_html}
            </ul>

            <p>
                Le recomendamos realizar el seguimiento correspondiente
                para garantizar el cumplimiento del proceso de formación.
            </p>

            <p>
                <strong>Atentamente,</strong><br>
                Plataforma de Formación Empresarial
            </p>
        </body>
        </html>
        """

        email_msg = EmailMultiAlternatives(
            subject=subject,
            body="Colaboradores sin avance en capacitaciones.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email]
        )

        email_msg.attach_alternative(html_message, "text/html")
        email_msg.send(fail_silently=False)
