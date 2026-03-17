from django.db import transaction
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
import os
import time
import logging
from typing import List, Tuple

from usuarios.models import Colaboradores

logger = logging.getLogger(__name__)

BATCH_SIZE = 500
DEFAULT_DELAY = 2


# ================================================================
# HELPERS COLABORADORES
# ================================================================

def get_nombre_completo(colaborador):
    return f"{colaborador.nombrecolaborador} {colaborador.apellidocolaborador}".strip()


# ================================================================
# HELPERS EDICION
# ================================================================

def obtener_edicion_activa():
    """Retorna la edición del mundial activa o None."""
    from .models import EdicionMundial
    return EdicionMundial.objects.filter(activa=True).first()


def primer_partido_edicion(edicion):
    """Retorna el primer partido de la edición."""
    return edicion.partidos.order_by("fecha", "hora").first()


def mundial_iniciado(edicion):
    """True si el mundial ya inició (1h antes del primer partido)."""
    return edicion.esta_iniciado()


# ================================================================
# BLOQUEOS AUTOMATICOS
# ================================================================

def verificar_bloqueos_partidos(edicion=None):
    """
    Verifica y bloquea todos los partidos que ya deben estar cerrados.
    Llamar desde un cron task o al inicio de cada request admin.

    Returns:
        int: Cantidad de partidos bloqueados en esta ejecución.
    """
    from .models import Partido, EstadoPartido
    filtros = {"estado": EstadoPartido.ABIERTO}
    if edicion:
        filtros["edicion"] = edicion

    partidos = Partido.objects.filter(**filtros)
    bloqueados = 0
    for partido in partidos:
        if partido.verificar_y_bloquear():
            bloqueados += 1
            logger.info(f"Partido bloqueado: {partido}")
    return bloqueados


def verificar_bloqueo_configuracion(edicion=None):
    """
    Bloquea la configuración del torneo si el mundial está a punto de iniciar.

    Returns:
        bool: True si se bloqueó en esta ejecución.
    """
    if not edicion:
        edicion = obtener_edicion_activa()
    if edicion:
        return edicion.verificar_y_bloquear_configuracion()
    return False


# ================================================================
# CALCULO DE PUNTOS - PARTIDOS
# ================================================================

def calcular_puntos_partido(prediccion, config_torneo):
    """
    Calcula y guarda los puntos de una predicción de partido.

    Returns:
        int: Total de puntos (tiempo reglamentario + penaltis).
    """
    prediccion.calcular_puntos(config_torneo)
    prediccion.save(update_fields=[
        "puntos_obtenidos", "puntos_penaltis", "es_acierto_exacto"
    ])
    return prediccion.puntos_totales()


@transaction.atomic
def evaluar_resultado_partido(partido, goles_local, goles_visitante,
                               fue_a_penaltis=False, penaltis_local=None, penaltis_visitante=None):
    """
    Registra el resultado final de un partido y calcula puntos para todas
    las predicciones asociadas. Actualiza el ranking de la edición.

    Args:
        partido: Instancia de Partido
        goles_local / goles_visitante: Resultado tiempo reglamentario
        fue_a_penaltis: Si el partido fue a penaltis
        penaltis_local / penaltis_visitante: Marcador de penaltis

    Returns:
        dict: Resumen del cálculo (exactos, ganadores, fallos, puntos totales repartidos)
    """
    from .models import EstadoPartido, ConfiguracionTorneo, RankingMundial

    # 1. Guardar resultado en el partido
    partido.goles_local = goles_local
    partido.goles_visitante = goles_visitante
    partido.fue_a_penaltis = fue_a_penaltis
    partido.penaltis_local = penaltis_local
    partido.penaltis_visitante = penaltis_visitante
    partido.estado = EstadoPartido.FINALIZADO
    partido.save()

    # 2. Obtener configuración de la edición
    config = ConfiguracionTorneo.obtener_para_edicion(partido.edicion)

    # 3. Calcular puntos para cada predicción
    predicciones = partido.predicciones.select_related("colaborador").all()
    resumen = {"exactos": 0, "ganadores": 0, "penaltis_exactos": 0,
               "penaltis_ganadores": 0, "fallos": 0, "total_evaluadas": 0}

    for prediccion in predicciones:
        prediccion.calcular_puntos(config)
        prediccion.save(update_fields=["puntos_obtenidos", "puntos_penaltis", "es_acierto_exacto"])

        # Estadísticas resumen
        resumen["total_evaluadas"] += 1
        if prediccion.es_acierto_exacto:
            resumen["exactos"] += 1
        elif prediccion.puntos_obtenidos and prediccion.puntos_obtenidos > 0:
            resumen["ganadores"] += 1
        else:
            resumen["fallos"] += 1

        if prediccion.puntos_penaltis and prediccion.puntos_penaltis >= config.puntos_resultado_exacto:
            resumen["penaltis_exactos"] += 1
        elif prediccion.puntos_penaltis and prediccion.puntos_penaltis > 0:
            resumen["penaltis_ganadores"] += 1

        # 4. Actualizar ranking de la edición
        if partido.edicion:
            ranking, _ = RankingMundial.objects.get_or_create(
                edicion=partido.edicion,
                colaborador=prediccion.colaborador,
            )
            ranking.agregar_puntos_partido(
                puntos=prediccion.puntos_obtenidos or 0,
                puntos_penaltis=prediccion.puntos_penaltis or 0,
                es_acierto_exacto=prediccion.es_acierto_exacto,
            )
            ranking.save()

    # 5. Recalcular posiciones del ranking
    if partido.edicion:
        recalcular_posiciones_ranking(partido.edicion)

    return resumen


# ================================================================
# RANKING
# ================================================================

def recalcular_posiciones_ranking(edicion):
    """
    Recalcula y guarda las posiciones del ranking para una edición.
    Criterio: mayor puntaje primero. Empate: quien predijo primero.
    Solo muestra las posiciones 1-N con todos los participantes.
    """
    from .models import RankingMundial
    rankings = list(
        RankingMundial.objects
        .filter(edicion=edicion)
        .order_by("-puntos_totales", "-aciertos_exactos", "fecha_primera_prediccion")
    )
    for i, ranking in enumerate(rankings, start=1):
        posicion_anterior = ranking.posicion
        ranking.posicion = i
        ranking.tendencia = posicion_anterior - i  # positivo = subió, negativo = bajó
        ranking.save(update_fields=["posicion", "tendencia"])


def recalcular_posiciones_ranking_especial(edicion):
    """
    Recalcula y guarda las posiciones del ranking especial para una edición.
    Criterio: mayor puntaje de predicciones especiales primero. Empate: quien predijo primero.
    """
    from .models import RankingEspecial
    rankings = list(
        RankingEspecial.objects
        .filter(edicion=edicion)
        .order_by("-puntos_totales", "-predicciones_especiales_acertadas", "fecha_primera_prediccion")
    )
    for i, ranking in enumerate(rankings, start=1):
        posicion_anterior = ranking.posicion
        ranking.posicion = i
        ranking.tendencia = posicion_anterior - i  # positivo = subió, negativo = bajó
        ranking.save(update_fields=["posicion", "tendencia"])


def verificar_y_bloquear_predicciones_especiales(edicion=None):
    """
    Verifica y bloquea todas las predicciones especiales que han llegado a su fecha de cierre.
    Si la fecha de cierre pasó, cambia estado de ABIERTA a BLOQUEADA.
    
    Args:
        edicion: EdicionMundial opcional. Si no se proporciona, revisa TODAS.
    
    Returns:
        int: Cantidad de predicciones bloqueadas en esta ejecución.
    """
    from .models import ConfiguracionPrediccionEspecial, EstadoPrediccionEspecial
    
    ahora = timezone.now()
    filtros = {"estado": EstadoPrediccionEspecial.ABIERTA}
    if edicion:
        filtros["edicion"] = edicion
    
    configs = ConfiguracionPrediccionEspecial.objects.filter(**filtros)
    bloqueadas = 0
    
    for config in configs:
        if ahora >= config.fecha_cierre:
            config.cerrar_prediccion()  # Cambia a CERRADA
            bloqueadas += 1
            logger.info(f"Predicción especial bloqueada: {config}")
    
    return bloqueadas


@transaction.atomic
def resolver_prediccion_especial(config_especial, resultado_equipo=None, resultado_jugador=None):
    """
    Resuelve una predicción especial: guarda el resultado real, evalúa todas
    las predicciones de los usuarios y otorga puntos a quienes acertaron.
    Actualiza el ranking especial de la edición.

    Args:
        config_especial: Instancia de ConfiguracionPrediccionEspecial
        resultado_equipo: Instancia de Equipo (para campeón, subcampeón, tercer lugar)
        resultado_jugador: Nombre del jugador (para máximo goleador)

    Returns:
        dict: Resumen del cálculo (total_evaluadas, acertadas, fallidas, puntos_totales_otorgados)
    """
    from .models import PrediccionEspecial, RankingEspecial, TipoPrediccionEspecial

    # 1. Resolver la configuración guardando el resultado
    config_especial.resolver_prediccion(
        resultado_equipo=resultado_equipo,
        resultado_jugador=resultado_jugador,
    )

    # 2. Determinar el valor de resultado_correcto según el tipo
    if config_especial.tipo in [
        TipoPrediccionEspecial.CAMPEON,
        TipoPrediccionEspecial.SUBCAMPEON,
        TipoPrediccionEspecial.TERCER_LUGAR,
    ]:
        resultado_correcto = resultado_equipo.id if resultado_equipo else None
    elif config_especial.tipo == TipoPrediccionEspecial.MAXIMO_GOLEADOR:
        resultado_correcto = resultado_jugador
    else:
        resultado_correcto = None

    if resultado_correcto is None:
        return {"error": "No se pudo determinar el resultado correcto."}

    # 3. Obtener todas las predicciones de usuarios para este tipo
    predicciones = PrediccionEspecial.objects.filter(
        tipo=config_especial.tipo,
    ).select_related("colaborador", "equipo_seleccionado")

    resumen = {
        "total_evaluadas": 0,
        "acertadas": 0,
        "fallidas": 0,
        "puntos_totales_otorgados": 0,
    }

    for prediccion in predicciones:
        resumen["total_evaluadas"] += 1
        puntos = prediccion.calcular_puntos(resultado_correcto)
        # Usar update() para bypassear validaciones (admin puede resolver aunque esté cerrada)
        PrediccionEspecial.objects.filter(pk=prediccion.pk).update(puntos_obtenidos=prediccion.puntos_obtenidos)

        if puntos and puntos > 0:
            resumen["acertadas"] += 1
            resumen["puntos_totales_otorgados"] += puntos
        else:
            resumen["fallidas"] += 1

        # 4. Actualizar ranking especial de la edición
        if config_especial.edicion:
            ranking, _ = RankingEspecial.objects.get_or_create(
                edicion=config_especial.edicion,
                colaborador=prediccion.colaborador,
            )
            ranking.agregar_puntos_especial(puntos or 0)
            ranking.save()

    # 5. Recalcular posiciones del ranking especial
    if config_especial.edicion:
        recalcular_posiciones_ranking_especial(config_especial.edicion)

    return resumen


def obtener_ranking_top(edicion, limite=10):
    """Retorna los top N del ranking de una edición."""
    from .models import RankingMundial
    return (
        RankingMundial.objects
        .filter(edicion=edicion)
        .select_related("colaborador")
        .order_by("posicion")[:limite]
    )


def obtener_posicion_usuario(edicion, colaborador):
    """Retorna el RankingMundial de un colaborador en una edición, o None."""
    from .models import RankingMundial
    return RankingMundial.objects.filter(edicion=edicion, colaborador=colaborador).first()


def registrar_primera_prediccion(colaborador, edicion, fecha):
    """
    Actualiza la fecha_primera_prediccion en el ranking si es la primera
    predicción del colaborador en esta edición (para desempate).
    """
    from .models import RankingMundial
    ranking, _ = RankingMundial.objects.get_or_create(
        edicion=edicion, colaborador=colaborador
    )
    if ranking.fecha_primera_prediccion is None:
        ranking.fecha_primera_prediccion = fecha
        ranking.save(update_fields=["fecha_primera_prediccion"])


def registrar_primera_prediccion_especial(colaborador, edicion, fecha):
    """
    Actualiza la fecha_primera_prediccion en el ranking especial si es la primera
    predicción especial del colaborador en esta edición (para desempate).
    """
    from .models import RankingEspecial
    ranking, _ = RankingEspecial.objects.get_or_create(
        edicion=edicion, colaborador=colaborador
    )
    if ranking.fecha_primera_prediccion is None:
        ranking.fecha_primera_prediccion = fecha
        ranking.save(update_fields=["fecha_primera_prediccion"])


# ================================================================
# ESTADISTICAS
# ================================================================

def obtener_estadisticas(edicion, colaborador=None):
    """
    Genera las estadísticas generales para la homepage y listado de partidos.

    Returns:
        dict con totales de participantes, partidos, equipos, predicciones, etc.
    """
    from .models import Partido, Prediccion, Equipo, EstadoPartido, ConfiguracionTorneo

    total_partidos = Partido.objects.filter(edicion=edicion).count()
    partidos_jugados = Partido.objects.filter(
        edicion=edicion, estado=EstadoPartido.FINALIZADO
    ).count()
    total_predicciones = Prediccion.objects.filter(partido__edicion=edicion).count()
    total_participantes = (
        Prediccion.objects
        .filter(partido__edicion=edicion)
        .values("colaborador")
        .distinct()
        .count()
    )
    total_equipos = Equipo.objects.filter(activo=True).count()

    config = ConfiguracionTorneo.obtener_para_edicion(edicion)
    fondo = config.fondo_premios_total if config else "$0"

    partidos_predichos_usuario = 0
    if colaborador:
        partidos_predichos_usuario = Prediccion.objects.filter(
            colaborador=colaborador, partido__edicion=edicion
        ).count()

    return {
        "total_participantes": total_participantes,
        "total_partidos": total_partidos,
        "partidos_jugados": partidos_jugados,
        "partidos_pendientes": total_partidos - partidos_jugados,
        "total_equipos": total_equipos,
        "total_predicciones": total_predicciones,
        "partidos_predichos_usuario": partidos_predichos_usuario,
        "fondo_premios": fondo,
    }


# ================================================================
# EMAIL MASIVO (función existente mantenida)
# ================================================================

def dividir_en_lotes(correos: List[str], tamanio_lote: int = BATCH_SIZE) -> List[List[str]]:
    if not correos:
        return []
    return [correos[i:i + tamanio_lote] for i in range(0, len(correos), tamanio_lote)]


def enviar_correo_batch(
    correos: List[str],
    subject: str,
    text_message: str,
    html_message: str,
    delay_entre_lotes: int = DEFAULT_DELAY,
    from_email: str = None,
    fail_silently: bool = False
) -> Tuple[int, int, List[str]]:
    """
    Envía un correo masivo dividiéndolo en lotes.
    Filtra automáticamente usuarios desactivados (estadocolaborador != 1).
    """
    if not correos:
        return 0, 0, []

    if from_email is None:
        from_email = settings.DEFAULT_FROM_EMAIL

    correos_validos = []
    omitidos = 0
    for email in correos:
        if not email or "@" not in email:
            continue
        activo = Colaboradores.objects.filter(
            correocolaborador=email, estadocolaborador=1
        ).exists()
        if not activo:
            omitidos += 1
            continue
        correos_validos.append(email)

    if omitidos:
        logger.warning(f"enviar_correo_batch: {omitidos} usuarios omitidos (desactivados).")

    lotes = dividir_en_lotes(correos_validos, BATCH_SIZE)
    if not lotes:
        return 0, len(correos), ["Sin emails válidos o todos desactivados"]

    total_enviados = 0
    total_fallidos = 0
    errores = []

    for num_lote, lote in enumerate(lotes, 1):
        try:
            msg = EmailMultiAlternatives(
                subject=subject, body=text_message,
                from_email=from_email, to=[], bcc=lote
            )
            msg.attach_alternative(html_message, "text/html")
            result = msg.send(fail_silently=fail_silently)
            total_enviados += result
            if num_lote < len(lotes):
                time.sleep(delay_entre_lotes)
        except Exception as e:
            total_fallidos += 1
            errores.append(f"Lote {num_lote}: {str(e)}")
            if not fail_silently:
                raise

    return total_enviados, total_fallidos, errores
