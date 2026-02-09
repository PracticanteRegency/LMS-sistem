from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from capacitaciones.models import progresoCapacitaciones, Capacitaciones
import time


def enviar_correo_batch(destinatarios_bcc, subject, text_message, html_message, max_por_lote=500, delay=2):
    """
    Envía correos masivos dividiendo en lotes de máximo 500 destinatarios (límite SMTP).
    
    Args:
        destinatarios_bcc (list): Lista de correos a enviar por BCC
        subject (str): Asunto del correo
        text_message (str): Contenido de texto
        html_message (str): Contenido HTML
        max_por_lote (int): Máximo de destinatarios por email (default: 500 - límite SMTP)
        delay (int): Segundos de espera entre lotes (default: 2)
    
    Returns:
        dict: Estadísticas de envío {enviados, fallidos, total, tasa_exito}
    """
    if not destinatarios_bcc:
        return {"enviados": 0, "fallidos": 0, "total": 0, "tasa_exito": 0}
    
    destinatarios_bcc = list(set(destinatarios_bcc))  # Eliminar duplicados
    total = len(destinatarios_bcc)
    enviados = 0
    fallidos = 0
    
    # Dividir en lotes
    for i in range(0, total, max_por_lote):
        lote = destinatarios_bcc[i:i+max_por_lote]
        
        try:
            email_msg = EmailMultiAlternatives(
                subject=subject,
                body=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[],  # No usamos TO para no aparecer en el correo
                bcc=lote  # Enviar a todos en BCC
            )
            
            if html_message:
                email_msg.attach_alternative(html_message, "text/html")
            
            email_msg.send(fail_silently=False)
            enviados += len(lote)
        except Exception as e:
            fallidos += len(lote)
            print(f"Error enviando lote: {e}")
        
        # Esperar entre lotes para evitar throttling
        if i + max_por_lote < total:
            time.sleep(delay)
    
    tasa_exito = round((enviados / total * 100), 2) if total > 0 else 0
    
    return {
        "enviados": enviados,
        "fallidos": fallidos,
        "total": total,
        "tasa_exito": tasa_exito,
        "lotes": (total + max_por_lote - 1) // max_por_lote
    }



def enviar_correos_por_lotes(destinatarios_bcc, subject, text_message, html_message, delay=2):
    """
    Función auxiliar para enviar correos masivos dividiendo en lotes de máximo 500 destinatarios.
    
    Args:
        destinatarios_bcc (list): Lista de correos a enviar
        subject (str): Asunto del correo
        text_message (str): Contenido de texto
        html_message (str): Contenido HTML
        delay (int): Segundos de espera entre lotes (default: 2)
    
    Returns:
        dict: Estadísticas de envío {enviados, fallidos, total, tasa_exito}
    """
    if not destinatarios_bcc:
        return {"enviados": 0, "fallidos": 0, "total": 0, "tasa_exito": 0}
    
    # Usar la función de batching existente
    return enviar_correo_batch(
        destinatarios_bcc=destinatarios_bcc,
        subject=subject,
        text_message=text_message,
        html_message=html_message
    )


@shared_task
def enviar_correo_capacitaciones_activas_y_activar():
    """
    Activa capacitaciones que inician hoy Y envía correos a colaboradores.
    Combina dos tareas: activación + notificación con batching automático.
    Se ejecuta cada día a las 12:00.
    """
    hoy = timezone.now().date()
    
    # Paso 1: Activar capacitaciones que inician hoy
    capacitaciones_a_activar = Capacitaciones.objects.filter(
        fecha_inicio__date=hoy,
        estado=0
    )

    for cap in capacitaciones_a_activar:
        cap.estado = 1
        cap.save()
        
        # Paso 2: Enviar correos a colaboradores de esta capacitación
        correos = list(
            progresoCapacitaciones.objects.filter(capacitacion=cap)
            .values_list("colaborador__correocolaborador", flat=True)
            .exclude(colaborador__correocolaborador__isnull=True)
            .exclude(colaborador__correocolaborador__exact="")
            .distinct()
        )

        if not correos:
            continue

        subject = f"🎓 Nueva Capacitación Activada: {cap.titulo}"

        text_message = (
            f"Estimado colaborador,\n\n"
            f"Reciba un cordial saludo.\n"
            f"Nos complace informarle que ha sido matriculado en la formación '{cap.titulo}'.\n\n"
            f"Fecha de inicio: {cap.fecha_inicio.date()}\n"
            f"Fecha de finalización: {cap.fecha_fin.date()}\n\n"
            f"Podrá acceder a la plataforma en: https://formacion.cloudregencyapps.com/login\n\n"
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
                <a href="https://formacion.cloudregencyapps.com/login" target="_blank">Acceder a la plataforma</a>
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

        # Usar batching automático para soportar 1500+ colaboradores
        # Máximo 500 correos por email, con 2 segundos de espera entre lotes
        enviar_correos_por_lotes(
            destinatarios_bcc=correos,
            subject=subject,
            text_message=text_message,
            html_message=html_message,
            delay=2
        )
        
        # Esperar 1 segundo entre capacitaciones
        time.sleep(1)


@shared_task
def notificar_capacitacion_por_vencer_7_dias():
    """
    Notifica sobre capacitaciones que vencen en 7 días. 
    Usa batching automático para soportar 1500+ colaboradores.
    Se ejecuta cada día a las 07:00.
    """
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

        text_message = (
            f"Estimado colaborador,\n\n"
            f"Le recordamos que la capacitación \"{cap.titulo}\" finalizará en 7 días.\n\n"
            f"Fecha de finalización: {cap.fecha_fin.date()}\n\n"
            f"Según nuestros registros, aún no ha completado esta formación.\n\n"
            f"Acceda a la plataforma: https://formacion.cloudregencyapps.com/login\n\n"
            f"Lo invitamos a ingresar a la plataforma y finalizarla lo antes posible.\n\n"
            f"Atentamente,\n"
            f"Área de Formación Empresarial"
        )

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
                <a href="https://formacion.cloudregencyapps.com/login" target="_blank">Ir a la plataforma</a>
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

        # Usar batching automático para soportar 1500+ colaboradores
        # Máximo 500 correos por email
        enviar_correos_por_lotes(
            destinatarios_bcc=correos,
            subject=subject,
            text_message=text_message,
            html_message=html_message,
            delay=2
        )
        
        # Esperar 1 segundo entre capacitaciones
        time.sleep(1)

@shared_task
def desactivar_capacitaciones():
    """
    Desactiva capacitaciones que vencen hoy.
    Se ejecuta cada día a las 23:59.
    """
    hoy = timezone.now().date()

    capacitaciones_a_desactivar = Capacitaciones.objects.filter(
        fecha_fin__date=hoy,
        estado=1
    )

    for cap in capacitaciones_a_desactivar:
        cap.estado = 0
        cap.save()

@shared_task
def notificar_capacitacion_por_vencer_1_dia():
    """
    Último aviso para capacitaciones que vencen mañana. 
    Usa batching automático para soportar 1500+ colaboradores.
    Se ejecuta cada día a las 07:30.
    """
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

        text_message = (
            f"Estimado colaborador,\n\n"
            f"Le informamos que mañana finaliza la capacitación \"{cap.titulo}\".\n\n"
            f"Aún aparece como NO completada en el sistema.\n\n"
            f"Fecha de finalización: {cap.fecha_fin.date()}\n\n"
            f"Acceda a la plataforma: https://formacion.cloudregencyapps.com/login\n\n"
            f"Le recomendamos completarla hoy mismo para evitar quedar como pendiente.\n\n"
            f"Atentamente,\n"
            f"Área de Formación Empresarial"
        )

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
                <a href="https://formacion.cloudregencyapps.com/login" target="_blank">Ir a la plataforma</a>
            </p>
            <p>
                Área de Formación Empresarial
            </p>
        </body>
        </html>
        """

        # Usar batching automático para soportar 1500+ colaboradores
        # Máximo 500 correos por email
        enviar_correos_por_lotes(
            destinatarios_bcc=correos,
            subject=subject,
            text_message=text_message,
            html_message=html_message,
            delay=2
        )
        
        # Esperar 1 segundo entre capacitaciones
        time.sleep(1)


@shared_task
def notificar_jefes_por_colaboradores_sin_progreso():
    """
    Notifica a los jefes de proyecto sobre colaboradores sin avance en capacitaciones.
    Se ejecuta cada lunes a las 09:00.
    Usa batching automático para soportar múltiples notificaciones.
    """
    registros = (
        progresoCapacitaciones.objects
        .select_related(
            "capacitacion",
            "colaborador",
            "colaborador__centroop__id_proyecto__encargado_proyecto"
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
        centro = colaborador.centroop

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
            "colaborador": f"{colaborador.nombrecolaborador} {colaborador.apellidocolaborador}",
            "capacitacion": r.capacitacion.titulo
        })

    # Agrupar notificaciones por lotes de máximo 50 jefes por email
    # y enviar masivamente
    emails_jefes = list(notificaciones.keys())
    
    # Dividir en lotes de 50 correos BCC
    lote_size = 50
    for i in range(0, len(emails_jefes), lote_size):
        lote_emails = emails_jefes[i:i+lote_size]
        
        # Construir cuerpo consolidado para este lote
        html_consolidado = "<html><body style='font-family: Arial, sans-serif;'>"
        
        for email_jefe in lote_emails:
            data = notificaciones[email_jefe]
            jefe = data["jefe"]
            proyecto = data["proyecto"]
            items = data["items"]
            
            listado_html = "".join(
                f"<li>{i['colaborador']} – <strong>{i['capacitacion']}</strong></li>"
                for i in items
            )
            
            html_consolidado += f"""
            <p><strong>{jefe.nombrecolaborador},</strong></p>
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
            <hr>
            """
        
        html_consolidado += """
            <p>
                <strong>Atentamente,</strong><br>
                Plataforma de Formación Empresarial
            </p>
        </body>
        </html>
        """
        
        subject = "⚠️ Colaboradores sin avance en capacitaciones - Reporte Semanal"
        text_message = "Reporte de colaboradores sin avance en capacitaciones."
        
        # Usar batching para enviar a múltiples jefes
        # Máximo 500 correos por email, con 2 segundos de espera
        enviar_correos_por_lotes(
            destinatarios_bcc=lote_emails,
            subject=subject,
            text_message=text_message,
            html_message=html_consolidado,
            delay=2
        )
        
        # Esperar 1 segundo entre lotes
        time.sleep(1)
