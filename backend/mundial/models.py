import os
from datetime import timedelta
from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.core.exceptions import ValidationError
from usuarios.models import Colaboradores


# ========== HELPERS ==========

def get_nombre_completo(colaborador):
    """Retorna el nombre completo del colaborador."""
    return f"{colaborador.nombrecolaborador} {colaborador.apellidocolaborador}".strip()


# ========== CHOICES / ENUMS ==========

class Fase(models.TextChoices):
    GRUPOS = "Grupos", "Grupos"
    DIECISEISAVOS = "16avos", "16avos"
    OCTAVOS = "Octavos", "Octavos"
    CUARTOS = "Cuartos", "Cuartos"
    SEMIFINALES = "Semifinales", "Semifinales"
    TERCER_PUESTO = "Tercer Puesto", "Tercer Puesto"
    FINAL = "Final", "Final"


class EstadoPartido(models.TextChoices):
    ABIERTO = "abierto", "Abierto"
    BLOQUEADO = "bloqueado", "Bloqueado"
    FINALIZADO = "finalizado", "Finalizado"


class TipoPrediccionEspecial(models.TextChoices):
    CAMPEON = "campeon", "Campeón"
    SUBCAMPEON = "subcampeon", "Subcampeón"
    TERCER_LUGAR = "tercer_lugar", "Tercer Lugar"
    MAXIMO_GOLEADOR = "maximo_goleador", "Máximo Goleador"


class EstadoPrediccionEspecial(models.TextChoices):
    ABIERTA = "abierta", "Abierta"
    BLOQUEADA = "bloqueada", "Bloqueada"
    RESUELTA = "resuelta", "Resuelta"


# ========== MODELOS ==========

class EdicionMundial(models.Model):
    """Maneja múltiples ediciones del torneo (adaptable para cada mundial)."""
    nombre = models.CharField(max_length=100)           # "USA/MX/CA 2026"
    anio = models.IntegerField()                         # 2026
    activa = models.BooleanField(default=False)          # Solo una activa a la vez
    bloqueo_configuracion = models.BooleanField(default=False)  # Se activa 1h antes del primer partido

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-anio"]
        verbose_name = "Edición del Mundial"
        verbose_name_plural = "Ediciones del Mundial"

    def __str__(self):
        return self.nombre

    def primer_partido(self):
        """Retorna el primer partido de esta edición."""
        return self.partidos.order_by("fecha", "hora").first()

    def fecha_hora_inicio(self):
        """Retorna la fecha+hora del primer partido como datetime aware."""
        partido = self.primer_partido()
        if not partido:
            return None
        return timezone.make_aware(
            timezone.datetime.combine(partido.fecha, partido.hora)
        )

    def esta_iniciado(self):
        """True si ya pasó el umbral de 1h antes del primer partido."""
        inicio = self.fecha_hora_inicio()
        if not inicio:
            return False
        return timezone.now() >= (inicio - timedelta(hours=1))

    def verificar_y_bloquear_configuracion(self):
        """Bloquea config si el mundial está a punto de iniciar."""
        if not self.bloqueo_configuracion and self.esta_iniciado():
            self.bloqueo_configuracion = True
            self.save(update_fields=["bloqueo_configuracion"])
            return True
        return False

    def save(self, *args, **kwargs):
        if self.activa:
            EdicionMundial.objects.exclude(pk=self.pk).update(activa=False)
        super().save(*args, **kwargs)


class Equipo(models.Model):
    """Modelo para equipos participantes en el torneo."""
    nombre = models.CharField(max_length=100, unique=True)
    bandera_imagen = models.ImageField(
        upload_to="mundial/banderas/", null=True, blank=True
    )  # Imagen local (usada al EDITAR)
    bandera_url = models.URLField(
        max_length=500, blank=True, null=True
    )  # URL Cloudinary (usada al CREAR)
    bandera_emoji = models.CharField(max_length=10, blank=True)  # Emoji fallback "🇲🇽"
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["nombre"]
        verbose_name = "Equipo"
        verbose_name_plural = "Equipos"

    def __str__(self):
        return self.nombre

    @property
    def bandera(self):
        """Retorna imagen local > URL Cloudinary > emoji."""
        if self.bandera_imagen:
            return self.bandera_imagen.url
        if self.bandera_url:
            return self.bandera_url
        return self.bandera_emoji or ""


@receiver(pre_save, sender=Equipo)
def eliminar_bandera_anterior(sender, instance, **kwargs):
    """Elimina la imagen anterior cuando el admin cambia la bandera del equipo."""
    if not instance.pk:
        return
    try:
        equipo_anterior = Equipo.objects.get(pk=instance.pk)
        if (equipo_anterior.bandera_imagen
                and equipo_anterior.bandera_imagen != instance.bandera_imagen):
            if os.path.isfile(equipo_anterior.bandera_imagen.path):
                os.remove(equipo_anterior.bandera_imagen.path)
    except Equipo.DoesNotExist:
        pass


class ConfiguracionPrediccionEspecial(models.Model):
    """Configuración para predicciones especiales - Administrada por admin."""
    edicion = models.ForeignKey(
        EdicionMundial,
        on_delete=models.CASCADE,
        related_name="configs_predicciones_especiales",
        null=True,
        blank=True,
    )
    tipo = models.CharField(max_length=30, choices=TipoPrediccionEspecial.choices)
    habilitada = models.BooleanField(default=True)
    fecha_cierre = models.DateTimeField()
    descripcion = models.TextField(blank=True)
    estado = models.CharField(
        max_length=20, choices=EstadoPrediccionEspecial.choices, default=EstadoPrediccionEspecial.ABIERTA
    )
    puntos_acierto = models.IntegerField(default=50)

    # Resultado real (definido por el admin cuando se resuelve)
    resultado_equipo = models.ForeignKey(
        'Equipo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resultados_especiales',
        help_text="Equipo ganador real (para campeón, subcampeón, tercer lugar)"
    )
    resultado_jugador = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="Jugador ganador real (para máximo goleador)"
    )

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuración de Predicción Especial"
        verbose_name_plural = "Configuraciones de Predicciones Especiales"
        ordering = ["fecha_cierre"]
        unique_together = ("edicion", "tipo")

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.fecha_cierre.strftime('%d/%m/%Y %H:%M')}"

    def esta_abierta(self):
        """Verifica si la predicción especial está abierta para responder."""
        ahora = timezone.now()
        # Solo verifica: habilitada, estado abierta, y que no haya pasado la fecha de cierre
        # Las predicciones especiales tienen su propia fecha de cierre, NO dependen del torneo
        return (
            self.habilitada 
            and self.estado == EstadoPrediccionEspecial.ABIERTA 
            and ahora < self.fecha_cierre
        )

    def puede_editarse(self):
        return self.esta_abierta()

    def cerrar_prediccion(self):
        """Cambia el estado a BLOQUEADA cuando la fecha de cierre se alcanza."""
        ahora = timezone.now()
        if ahora >= self.fecha_cierre and self.estado == EstadoPrediccionEspecial.ABIERTA:
            self.estado = EstadoPrediccionEspecial.BLOQUEADA
            self.save(update_fields=["estado"])

    def resolver_prediccion(self, resultado_equipo=None, resultado_jugador=None):
        """Resuelve la predicción especial guardando el resultado real."""
        self.estado = EstadoPrediccionEspecial.RESUELTA
        if resultado_equipo:
            self.resultado_equipo = resultado_equipo
        if resultado_jugador:
            self.resultado_jugador = resultado_jugador
        self.save()


class Partido(models.Model):
    """Modelo para partidos del torneo."""
    edicion = models.ForeignKey(
        EdicionMundial, on_delete=models.CASCADE, related_name="partidos", null=True, blank=True
    )
    equipo_local = models.ForeignKey(
        Equipo, on_delete=models.PROTECT, related_name="partidos_local"
    )
    equipo_visitante = models.ForeignKey(
        Equipo, on_delete=models.PROTECT, related_name="partidos_visitante"
    )
    fecha = models.DateField()
    hora = models.TimeField()
    fase = models.CharField(max_length=20, choices=Fase.choices)
    grupo = models.CharField(max_length=1, null=True, blank=True)
    multiplicador = models.CharField(max_length=5, default="x1")
    estado = models.CharField(
        max_length=20, choices=EstadoPartido.choices, default=EstadoPartido.ABIERTO
    )

    # Resultado tiempo reglamentario
    goles_local = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])
    goles_visitante = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])

    # Resultado penaltis (solo si el partido fue a penaltis)
    fue_a_penaltis = models.BooleanField(default=False)
    penaltis_local = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])
    penaltis_visitante = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["fecha", "hora"]
        verbose_name = "Partido"
        verbose_name_plural = "Partidos"
        indexes = [
            models.Index(fields=["fecha", "hora"]),
            models.Index(fields=["fase", "estado"]),
            models.Index(fields=["estado"]),
            models.Index(fields=["edicion", "estado"]),
        ]

    def __str__(self):
        return f"{self.equipo_local.nombre} vs {self.equipo_visitante.nombre} - {self.fecha}"

    @property
    def fecha_hora_inicio(self):
        """Retorna la fecha+hora del partido como datetime aware."""
        return timezone.make_aware(
            timezone.datetime.combine(self.fecha, self.hora)
        )

    @property
    def resultado(self):
        """Retorna el resultado como dict o None si no está disponible."""
        if self.goles_local is not None and self.goles_visitante is not None:
            data = {"local": self.goles_local, "visitante": self.goles_visitante}
            if self.fue_a_penaltis and self.penaltis_local is not None:
                data["penaltis"] = {
                    "local": self.penaltis_local,
                    "visitante": self.penaltis_visitante,
                }
            return data
        return None

    @property
    def ganador(self):
        """Retorna el ganador en tiempo reglamentario: 'local', 'visitante', 'empate', o None."""
        if self.resultado is None:
            return None
        if self.goles_local > self.goles_visitante:
            return "local"
        elif self.goles_visitante > self.goles_local:
            return "visitante"
        else:
            return "empate"

    @property
    def ganador_penaltis(self):
        """Retorna el ganador en penaltis o None."""
        if not self.fue_a_penaltis or self.penaltis_local is None:
            return None
        if self.penaltis_local > self.penaltis_visitante:
            return "local"
        elif self.penaltis_visitante > self.penaltis_local:
            return "visitante"
        return None

    def puede_predecir(self):
        """Acepta predicciones si está ABIERTO y faltan más de 1 hora para el partido."""
        if self.estado.lower() != EstadoPartido.ABIERTO:
            return False
        return timezone.now() < (self.fecha_hora_inicio - timedelta(hours=1))

    def puede_editar_admin(self):
        """Admin puede editar campos del partido solo si está ABIERTO."""
        return self.estado.lower() == EstadoPartido.ABIERTO

    def puede_ingresar_resultado(self):
        """Admin puede ingresar resultado solo si el partido está BLOQUEADO."""
        return self.estado.lower() == EstadoPartido.BLOQUEADO

    def verificar_y_bloquear(self):
        """Bloquea el partido automáticamente cuando ya no acepta predicciones."""
        if self.estado.lower() == EstadoPartido.ABIERTO and not self.puede_predecir():
            self.estado = EstadoPartido.BLOQUEADO
            self.save(update_fields=["estado"])
            return True
        return False


class Prediccion(models.Model):
    """Modelo para predicciones de usuarios sobre partidos."""
    colaborador = models.ForeignKey(
        Colaboradores, on_delete=models.CASCADE, related_name="predicciones_mundial"
    )
    partido = models.ForeignKey(Partido, on_delete=models.CASCADE, related_name="predicciones")

    # Predicción tiempo reglamentario
    goles_local = models.IntegerField(validators=[MinValueValidator(0)])
    goles_visitante = models.IntegerField(validators=[MinValueValidator(0)])
    ganador = models.CharField(
        max_length=10, choices=[("local", "Local"), ("visitante", "Visitante"), ("empate", "Empate")]
    )

    # Predicción penaltis (opcional, solo si el usuario predice empate)
    predice_penaltis = models.BooleanField(default=False)
    penaltis_local = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])
    penaltis_visitante = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])
    ganador_penaltis = models.CharField(
        max_length=10,
        choices=[("local", "Local"), ("visitante", "Visitante")],
        null=True, blank=True,
    )

    # Puntos
    puntos_obtenidos = models.IntegerField(null=True, blank=True)  # Tiempo reglamentario
    puntos_penaltis = models.IntegerField(null=True, blank=True)    # Bonus por penaltis
    es_acierto_exacto = models.BooleanField(default=False)

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("colaborador", "partido")
        verbose_name = "Predicción"
        verbose_name_plural = "Predicciones"
        indexes = [
            models.Index(fields=["colaborador", "partido"]),
            models.Index(fields=["partido"]),
            models.Index(fields=["colaborador", "creado_en"]),
        ]

    def __str__(self):
        return f"{get_nombre_completo(self.colaborador)} - {self.partido} ({self.goles_local}:{self.goles_visitante})"

    def calcular_puntos(self, config_torneo):
        """
        Calcula los puntos de la predicción según la configuración.
        Reglas:
          TIEMPO REGLAMENTARIO:
          - Resultado exacto (ej: 2-2) → puntos_resultado_exacto (3 pts)
          - Solo ganador correcto (incluyendo empate) → puntos_ganador_correcto (1 pt)
          - No se acumulan ambos (exacto o ganador, lo que aplique)
          
          PENALTIS (cuando el partido fue a penaltis):
          - Solo se evalúan si el usuario predijo penaltis (predice_penaltis=True)
          - Marcador exacto penaltis → +puntos_resultado_exacto (3 pts)
          - Solo ganador penaltis correcto → +puntos_ganador_correcto (1 pt)
          
          - Todos los puntos se multiplican por el multiplicador de la fase
        """
        if self.partido.resultado is None:
            return None

        self.es_acierto_exacto = False
        puntos_base = 0

        # Tiempo reglamentario
        if (self.goles_local == self.partido.goles_local
                and self.goles_visitante == self.partido.goles_visitante):
            # Resultado exacto
            puntos_base = config_torneo.puntos_resultado_exacto
            self.es_acierto_exacto = True
        elif self.ganador == self.partido.ganador:
            # Solo ganador correcto (incluyendo empate)
            puntos_base = config_torneo.puntos_ganador_correcto

        # Multiplicador de la fase
        multiplicador_str = config_torneo.obtener_multiplicador_por_fase(self.partido.fase)
        try:
            multiplicador = float(multiplicador_str.replace("x", ""))
        except (ValueError, AttributeError):
            multiplicador = 1.0

        self.puntos_obtenidos = int(puntos_base * multiplicador)

        # Penaltis (adicionales, solo si el partido fue a penaltis y el usuario predijo)
        self.puntos_penaltis = 0
        if (self.partido.fue_a_penaltis
                and self.predice_penaltis
                and self.partido.penaltis_local is not None):
            puntos_pen_base = 0
            if (self.penaltis_local == self.partido.penaltis_local
                    and self.penaltis_visitante == self.partido.penaltis_visitante):
                # Marcador exacto penaltis
                puntos_pen_base = config_torneo.puntos_resultado_exacto
            elif self.ganador_penaltis == self.partido.ganador_penaltis:
                # Solo ganador penaltis correcto
                puntos_pen_base = config_torneo.puntos_ganador_correcto
            self.puntos_penaltis = int(puntos_pen_base * multiplicador)

        return self.puntos_obtenidos

    def puntos_totales(self):
        """Suma puntos de tiempo reglamentario + penaltis."""
        return (self.puntos_obtenidos or 0) + (self.puntos_penaltis or 0)


class PrediccionEspecial(models.Model):
    """Modelo para predicciones especiales (campeón, subcampeón, etc.)."""
    colaborador = models.ForeignKey(
        Colaboradores, on_delete=models.CASCADE, related_name="predicciones_especiales_mundial"
    )
    tipo = models.CharField(
        max_length=20, choices=TipoPrediccionEspecial.choices
    )

    # Para predicciones de equipo (campeón, subcampeón, tercer lugar)
    equipo_seleccionado = models.ForeignKey(
        Equipo,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="predicciones_especiales",
    )

    # Para predicciones de jugador (máximo goleador)
    jugador_seleccionado = models.CharField(
        max_length=200, null=True, blank=True
    )  # "Nombre del Jugador"

    puntos_obtenidos = models.IntegerField(
        null=True, blank=True
    )  # null hasta que se resuelva

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("colaborador", "tipo")
        verbose_name = "Predicción Especial"
        verbose_name_plural = "Predicciones Especiales"
        indexes = [
            models.Index(fields=["colaborador", "tipo"]),
        ]

    def __str__(self):
        seleccionado = self.equipo_seleccionado.nombre if self.equipo_seleccionado else self.jugador_seleccionado
        return f"{get_nombre_completo(self.colaborador)} - {self.get_tipo_display()}: {seleccionado}"

    def _get_config(self):
        """Retorna la ConfiguracionPrediccionEspecial correspondiente a este tipo."""
        try:
            return ConfiguracionPrediccionEspecial.objects.get(tipo=self.tipo)
        except ConfiguracionPrediccionEspecial.DoesNotExist:
            return None

    def puede_editarse(self):
        """Verifica si la predicción especial puede ser editada."""
        config = self._get_config()
        return config.esta_abierta() if config else False

    def validar_edicion(self):
        """Valida que la predicción pueda ser editada, lanza excepción si no."""
        if not self.puede_editarse():
            config = self._get_config()
            if config:
                raise ValidationError(
                    f"Las predicciones especiales para {config.get_tipo_display()} "
                    f"se cerraron el {config.fecha_cierre.strftime('%d/%m/%Y a las %H:%M')}"
                )
            raise ValidationError("Esta predicción especial no está disponible en este momento")

    def clean(self):
        """Valida antes de guardar (solo se ejecuta desde Django Admin/forms)."""
        super().clean()
        self.validar_edicion()
        
        # Valida que tenga equipo o jugador seleccionado según el tipo
        if self.tipo in [TipoPrediccionEspecial.CAMPEON, TipoPrediccionEspecial.SUBCAMPEON, TipoPrediccionEspecial.TERCER_LUGAR]:
            if not self.equipo_seleccionado:
                raise ValidationError(f"Debes seleccionar un equipo para {self.get_tipo_display()}")
        elif self.tipo == TipoPrediccionEspecial.MAXIMO_GOLEADOR:
            if not self.jugador_seleccionado:
                raise ValidationError("Debes seleccionar un jugador para máximo goleador")

    def calcular_puntos(self, resultado_correcto):
        """
        Calcula los puntos basado en si la predicción es correcta.
        
        Args:
            resultado_correcto: El valor correcto (equipo_id o nombre jugador)
        
        Returns:
            int: Puntos ganados (0 si no acierta, puntos_acierto si acierta)
        """
        config = self._get_config()
        if not config:
            return 0
        
        # Verifica si acertó
        if self.tipo in [TipoPrediccionEspecial.CAMPEON, TipoPrediccionEspecial.SUBCAMPEON, TipoPrediccionEspecial.TERCER_LUGAR]:
            es_correcto = self.equipo_seleccionado and resultado_correcto == self.equipo_seleccionado.id
        elif self.tipo == TipoPrediccionEspecial.MAXIMO_GOLEADOR:
            es_correcto = self.jugador_seleccionado and resultado_correcto == self.jugador_seleccionado
        else:
            es_correcto = False
        
        self.puntos_obtenidos = config.puntos_acierto if es_correcto else 0
        return self.puntos_obtenidos


class RankingMundial(models.Model):
    """Ranking de participantes por edición del mundial (solo predicciones de partidos)."""
    edicion = models.ForeignKey(
        EdicionMundial, on_delete=models.CASCADE, related_name="ranking"
    )
    colaborador = models.ForeignKey(
        Colaboradores, on_delete=models.CASCADE, related_name="rankings_mundial"
    )
    posicion = models.IntegerField(default=0)

    # Puntos partidos
    puntos_partidos = models.IntegerField(default=0)
    aciertos_exactos = models.IntegerField(default=0)

    # Total (solo de partidos)
    puntos_totales = models.IntegerField(default=0)
    tendencia = models.IntegerField(default=0)  # Cambio de posición (+5, -1, 0)

    # Desempate: quien predijo primero va adelante si hay igualdad de puntos
    fecha_primera_prediccion = models.DateTimeField(null=True, blank=True)

    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Ranking Mundial"
        verbose_name_plural = "Rankings Mundiales"
        unique_together = ("edicion", "colaborador")
        ordering = ["posicion", "fecha_primera_prediccion"]
        indexes = [
            models.Index(fields=["edicion", "puntos_totales"]),
            models.Index(fields=["edicion", "posicion"]),
        ]

    def __str__(self):
        return (
            f"#{self.posicion} [{self.edicion.nombre}] "
            f"{get_nombre_completo(self.colaborador)} ({self.puntos_totales} pts)"
        )

    def save(self, *args, **kwargs):
        """
        Sobrescribir save para asignar automáticamente la última posición
        cuando se crea un nuevo ranking (posicion=0).
        """
        if self.posicion == 0:
            # Asignar la última posición disponible + 1
            max_posicion = RankingMundial.objects.filter(
                edicion=self.edicion
            ).aggregate(max_pos=models.Max('posicion'))['max_pos'] or 0
            self.posicion = max_posicion + 1
        
        super().save(*args, **kwargs)

    def calcular_puntos_totales(self):
        self.puntos_totales = self.puntos_partidos
        return self.puntos_totales

    def agregar_puntos_partido(self, puntos, puntos_penaltis=0, es_acierto_exacto=False):
        self.puntos_partidos += puntos + puntos_penaltis
        if es_acierto_exacto:
            self.aciertos_exactos += 1
        self.calcular_puntos_totales()

    def obtener_datos_usuario(self):
        iniciales = ""
        partes = get_nombre_completo(self.colaborador).split()
        if len(partes) >= 2:
            iniciales = partes[0][0] + partes[-1][0]
        elif partes:
            iniciales = partes[0][0]
        return {
            "id": self.colaborador.idcolaborador,
            "nombre": get_nombre_completo(self.colaborador),
            "iniciales": iniciales.upper(),
            "email": self.colaborador.correocolaborador,
            "posicion": self.posicion,
            "puntos_totales": self.puntos_totales,
            "puntos_partidos": self.puntos_partidos,
            "aciertos_exactos": self.aciertos_exactos,
            "tendencia": self.tendencia,
        }

    def obtener_desglose_puntos(self):
        return {
            "partidos": {"puntos": self.puntos_partidos, "aciertos_exactos": self.aciertos_exactos},
            "total": self.puntos_totales,
        }


class RankingEspecial(models.Model):
    """Ranking de participantes por edición del mundial (solo predicciones especiales)."""
    edicion = models.ForeignKey(
        EdicionMundial, on_delete=models.CASCADE, related_name="ranking_especial"
    )
    colaborador = models.ForeignKey(
        Colaboradores, on_delete=models.CASCADE, related_name="rankings_especiales"
    )
    posicion = models.IntegerField(default=0)

    # Puntos predicciones especiales
    puntos_especiales = models.IntegerField(default=0)
    predicciones_especiales_acertadas = models.IntegerField(default=0)

    # Total (solo de predicciones especiales)
    puntos_totales = models.IntegerField(default=0)
    tendencia = models.IntegerField(default=0)  # Cambio de posición (+5, -1, 0)

    # Desempate: quien predijo primero va adelante si hay igualdad de puntos
    fecha_primera_prediccion = models.DateTimeField(null=True, blank=True)

    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Ranking Especial"
        verbose_name_plural = "Rankings Especiales"
        unique_together = ("edicion", "colaborador")
        ordering = ["posicion", "fecha_primera_prediccion"]
        indexes = [
            models.Index(fields=["edicion", "puntos_totales"]),
            models.Index(fields=["edicion", "posicion"]),
        ]

    def __str__(self):
        return (
            f"#{self.posicion} [{self.edicion.nombre}] "
            f"{get_nombre_completo(self.colaborador)} ({self.puntos_totales} pts especiales)"
        )

    def save(self, *args, **kwargs):
        """
        Sobrescribir save para asignar automáticamente la última posición
        cuando se crea un nuevo ranking (posicion=0).
        """
        if self.posicion == 0:
            # Asignar la última posición disponible + 1
            max_posicion = RankingEspecial.objects.filter(
                edicion=self.edicion
            ).aggregate(max_pos=models.Max('posicion'))['max_pos'] or 0
            self.posicion = max_posicion + 1
        
        super().save(*args, **kwargs)

    def calcular_puntos_totales(self):
        self.puntos_totales = self.puntos_especiales
        return self.puntos_totales

    def agregar_puntos_especial(self, puntos):
        self.puntos_especiales += puntos
        if puntos > 0:
            self.predicciones_especiales_acertadas += 1
        self.calcular_puntos_totales()

    def obtener_datos_usuario(self):
        iniciales = ""
        partes = get_nombre_completo(self.colaborador).split()
        if len(partes) >= 2:
            iniciales = partes[0][0] + partes[-1][0]
        elif partes:
            iniciales = partes[0][0]
        return {
            "id": self.colaborador.idcolaborador,
            "nombre": get_nombre_completo(self.colaborador),
            "iniciales": iniciales.upper(),
            "email": self.colaborador.correocolaborador,
            "posicion": self.posicion,
            "puntos_totales": self.puntos_totales,
            "puntos_especiales": self.puntos_especiales,
            "predicciones_especiales_acertadas": self.predicciones_especiales_acertadas,
            "tendencia": self.tendencia,
        }

    def obtener_desglose_puntos(self):
        return {
            "especiales": {"puntos": self.puntos_especiales, "acertadas": self.predicciones_especiales_acertadas},
            "total": self.puntos_totales,
        }


class ConfiguracionTorneo(models.Model):
    """Configuración del torneo por edición."""
    edicion = models.OneToOneField(
        EdicionMundial, on_delete=models.CASCADE, related_name="configuracion", null=True, blank=True
    )

    # Puntuación
    puntos_resultado_exacto = models.IntegerField(default=3)
    puntos_ganador_correcto = models.IntegerField(default=1)

    # Multiplicadores por fase
    multiplicador_grupos = models.CharField(max_length=5, default="x1")
    multiplicador_dieciseisavos = models.CharField(max_length=5, default="x1.25")
    multiplicador_octavos = models.CharField(max_length=5, default="x1.5")
    multiplicador_cuartos = models.CharField(max_length=5, default="x1.75")
    multiplicador_semifinales = models.CharField(max_length=5, default="x2")
    multiplicador_tercer_puesto = models.CharField(max_length=5, default="x2.5")
    multiplicador_final = models.CharField(max_length=5, default="x3")

    # Premios
    porcentaje_primer_lugar = models.CharField(max_length=10, default="50%")
    porcentaje_segundo_lugar = models.CharField(max_length=10, default="30%")
    porcentaje_tercer_lugar = models.CharField(max_length=10, default="20%")
    fondo_premios_total = models.CharField(max_length=50, default="$50,000")

    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuración del Torneo"
        verbose_name_plural = "Configuraciones del Torneo"

    def __str__(self):
        return f"Configuración - {self.edicion.nombre if self.edicion else 'Sin edición'}"

    @classmethod
    def obtener_para_edicion(cls, edicion):
        """Obtiene o crea la configuración para la edición indicada."""
        instancia, _ = cls.objects.get_or_create(edicion=edicion)
        return instancia

    def puede_editarse(self):
        """La configuración se bloquea 1h antes del primer partido de la edición."""
        if self.edicion:
            return not self.edicion.bloqueo_configuracion
        return True

    def obtener_multiplicador_por_fase(self, fase):
        """Obtiene el multiplicador para una fase específica."""
        mapa_multiplicadores = {
            Fase.GRUPOS: self.multiplicador_grupos,
            Fase.DIECISEISAVOS: self.multiplicador_dieciseisavos,
            Fase.OCTAVOS: self.multiplicador_octavos,
            Fase.CUARTOS: self.multiplicador_cuartos,
            Fase.SEMIFINALES: self.multiplicador_semifinales,
            Fase.TERCER_PUESTO: self.multiplicador_tercer_puesto,
            Fase.FINAL: self.multiplicador_final,
        }
        return mapa_multiplicadores.get(fase, "x1")
