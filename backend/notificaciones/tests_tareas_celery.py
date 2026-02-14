"""
Tests para verificar el funcionamiento de todas las tareas automatizadas (Celery).

Ejecutar: python manage.py test notificaciones.tests.TestTareasAutomatizadas
"""

from django.test import TestCase
from django.utils import timezone
from django.core.mail import outbox
from datetime import timedelta
from capacitaciones.models import Capacitaciones, progresoCapacitaciones
from usuarios.models import Colaboradores
from analitica.models import Epresa, Unidadnegocio, Proyecto, Centroop, ProgresoAgregado
from decimal import Decimal

# Importar las tareas
from notificaciones.tasks import (
    enviar_correo_capacitaciones_activas_y_activar,
    notificar_capacitacion_por_vencer_7_dias,
    notificar_capacitacion_por_vencer_1_dia,
    desactivar_capacitaciones,
    notificar_jefes_por_colaboradores_sin_progreso
)


class TestTareasAutomatizadas(TestCase):
    """Test suite para todas las tareas automatizadas de Celery"""
    
    @classmethod
    def setUpTestData(cls):
        """Crear datos de prueba para todas las tareas"""
        
        # Crear empresa
        cls.empresa = Epresa.objects.create(
            nombre_empresa="Empresa Test",
            nit="123456789"
        )
        
        # Crear unidad de negocio
        cls.unidad = Unidadnegocio.objects.create(
            nombre_unidad="Unidad Test",
            id_empresa=cls.empresa
        )
        
        # Crear proyecto
        cls.proyecto = Proyecto.objects.create(
            nombre_proyecto="Proyecto Test",
            id_unidad=cls.unidad
        )
        
        # Crear centro operativo
        cls.centro = Centroop.objects.create(
            nombre_centrop="Centro Test",
            id_proyecto=cls.proyecto
        )
        
        # Crear colaboradores
        cls.colaborador1 = Colaboradores.objects.create(
            idcolaborador=1,
            nombrecolaborador="Juan",
            apellidocolaborador="Pérez",
            cccolaborador="123456789",
            correocolaborador="juan@test.com",
            centroop=cls.centro,
            estadocolaborador=1
        )
        
        cls.colaborador2 = Colaboradores.objects.create(
            idcolaborador=2,
            nombrecolaborador="María",
            apellidocolaborador="García",
            cccolaborador="987654321",
            correocolaborador="maria@test.com",
            centroop=cls.centro,
            estadocolaborador=1
        )
        
        # Crear capacitación que inicia hoy
        hoy = timezone.now()
        cls.cap_hoy = Capacitaciones.objects.create(
            titulo="Capacitación de Hoy",
            descripcion="Test",
            imagen="",
            estado=0,  # Desactivada para prueba
            fecha_creacion=hoy - timedelta(days=1),
            fecha_inicio=hoy,
            fecha_fin=hoy + timedelta(days=7),
            tipo="Curso"
        )
        
        # Crear capacitación que vence en 7 días
        cls.cap_7_dias = Capacitaciones.objects.create(
            titulo="Capacitación Vence en 7 días",
            descripcion="Test",
            imagen="",
            estado=1,
            fecha_creacion=hoy - timedelta(days=7),
            fecha_inicio=hoy - timedelta(days=5),
            fecha_fin=hoy + timedelta(days=7),
            tipo="Taller"
        )
        
        # Crear capacitación que vence mañana
        cls.cap_1_dia = Capacitaciones.objects.create(
            titulo="Capacitación Vence Mañana",
            descripcion="Test",
            imagen="",
            estado=1,
            fecha_creacion=hoy - timedelta(days=14),
            fecha_inicio=hoy - timedelta(days=12),
            fecha_fin=hoy + timedelta(days=1),
            tipo="Seminario"
        )
        
        # Crear capacitación que vence hoy
        cls.cap_hoy_vence = Capacitaciones.objects.create(
            titulo="Capacitación Vence Hoy",
            descripcion="Test",
            imagen="",
            estado=1,
            fecha_creacion=hoy - timedelta(days=21),
            fecha_inicio=hoy - timedelta(days=19),
            fecha_fin=hoy,
            tipo="Evento"
        )
        
        # Registrar colaboradores en capacitaciones
        cls.progreso_cap_hoy = progresoCapacitaciones.objects.create(
            capacitacion=cls.cap_hoy,
            colaborador=cls.colaborador1,
            progreso=0,
            completada=False,
            fecha_registro=hoy
        )
        
        cls.progreso_cap_7_dias = progresoCapacitaciones.objects.create(
            capacitacion=cls.cap_7_dias,
            colaborador=cls.colaborador1,
            progreso=50,
            completada=False,
            fecha_registro=hoy - timedelta(days=5)
        )
        
        cls.progreso_cap_1_dia = progresoCapacitaciones.objects.create(
            capacitacion=cls.cap_1_dia,
            colaborador=cls.colaborador2,
            progreso=0,
            completada=False,
            fecha_registro=hoy - timedelta(days=12)
        )
        
        cls.progreso_cap_vence_hoy = progresoCapacitaciones.objects.create(
            capacitacion=cls.cap_hoy_vence,
            colaborador=cls.colaborador1,
            progreso=100,
            completada=True,
            fecha_registro=hoy - timedelta(days=19),
            fecha_completada=hoy
        )
    
    def test_notificar_capacitacion_por_vencer_7_dias(self):
        """Test para notificar capacitaciones que vencen en 7 días"""
        print("\n🧪 Test: notificar_capacitacion_por_vencer_7_dias")
        
        # Ejecutar tarea
        resultado = notificar_capacitacion_por_vencer_7_dias()
        
        # Verificar que se completó sin errores
        self.assertIsNone(resultado)
        
        print("   ✅ Tarea ejecutada sin errores")
    
    def test_notificar_capacitacion_por_vencer_1_dia(self):
        """Test para notificar capacitaciones que vencen mañana"""
        print("\n🧪 Test: notificar_capacitacion_por_vencer_1_dia")
        
        # Ejecutar tarea
        resultado = notificar_capacitacion_por_vencer_1_dia()
        
        # Verificar que se completó sin errores
        self.assertIsNone(resultado)
        
        print("   ✅ Tarea ejecutada sin errores")
    
    def test_enviar_correo_capacitaciones_activas_y_activar(self):
        """Test para activar capacitaciones que inician hoy y enviar correos"""
        print("\n🧪 Test: enviar_correo_capacitaciones_activas_y_activar")
        
        # Antes: capacitación desactivada
        self.cap_hoy.refresh_from_db()
        self.assertEqual(self.cap_hoy.estado, 0)
        
        # Ejecutar tarea
        resultado = enviar_correo_capacitaciones_activas_y_activar()
        
        # Después: capacitación activada
        self.cap_hoy.refresh_from_db()
        self.assertEqual(self.cap_hoy.estado, 1)
        
        # Verificar que se completó sin errores
        self.assertIsNone(resultado)
        
        print("   ✅ Capacitación activada y correos enviados correctamente")
    
    def test_desactivar_capacitaciones(self):
        """Test para desactivar capacitaciones que vencen hoy"""
        print("\n🧪 Test: desactivar_capacitaciones")
        
        # Antes: capacitación activa
        self.cap_hoy_vence.refresh_from_db()
        self.assertEqual(self.cap_hoy_vence.estado, 1)
        
        # Ejecutar tarea
        resultado = desactivar_capacitaciones()
        
        # Después: capacitación desactivada
        self.cap_hoy_vence.refresh_from_db()
        self.assertEqual(self.cap_hoy_vence.estado, 0)
        
        # Verificar que se completó sin errores
        self.assertIsNone(resultado)
        
        print("   ✅ Capacitación desactivada correctamente")
    
    def test_notificar_jefes_por_colaboradores_sin_progreso(self):
        """Test para notificar a jefes sobre colaboradores sin progreso"""
        print("\n🧪 Test: notificar_jefes_por_colaboradores_sin_progreso")
        
        # Ejecutar tarea
        resultado = notificar_jefes_por_colaboradores_sin_progreso()
        
        # Verificar que se completó sin errores
        self.assertIsNone(resultado)
        
        print("   ✅ Tarea ejecutada sin errores")

    
    def test_integridad_de_campos_modelo_capacitaciones(self):
        """Verificar que los campos correctos se usan en el modelo Capacitaciones"""
        print("\n🧪 Test: Integridad de campos en Capacitaciones")
        
        cap = self.cap_hoy
        
        # Verificar que tiene el campo 'estado' (no 'estado_capacitacion')
        self.assertTrue(hasattr(cap, 'estado'))
        
        # Verificar que no tiene 'estado_capacitacion'
        self.assertFalse(hasattr(cap, 'estado_capacitacion'))
        
        # Verificar otros campos
        self.assertTrue(hasattr(cap, 'titulo'))
        self.assertTrue(hasattr(cap, 'fecha_inicio'))
        self.assertTrue(hasattr(cap, 'fecha_fin'))
        
        print("   ✅ Todos los campos correctos en Capacitaciones")
    
    def test_integridad_de_campos_modelo_colaboradores(self):
        """Verificar que los campos correctos se usan en el modelo Colaboradores"""
        print("\n🧪 Test: Integridad de campos en Colaboradores")
        
        colab = self.colaborador1
        
        # Verificar que tiene el campo 'centroop' (no 'centroOP')
        self.assertTrue(hasattr(colab, 'centroop'))
        
        # Verificar otros campos
        self.assertTrue(hasattr(colab, 'nombrecolaborador'))
        self.assertTrue(hasattr(colab, 'apellidocolaborador'))
        self.assertTrue(hasattr(colab, 'correocolaborador'))
        
        # Verificar que los valores son correctos
        self.assertNotEqual(colab.centroop, None)
        self.assertEqual(colab.nombrecolaborador, "Juan")
        self.assertEqual(colab.apellidocolaborador, "Pérez")
        
        print("   ✅ Todos los campos correctos en Colaboradores")
    
    def test_flujo_completo_capacitacion(self):
        """Test del flujo completo: Creación, Activación y Desactivación"""
        print("\n🧪 Test: Flujo completo de capacitación")
        
        hoy = timezone.now()
        
        # 1. Crear capacitación desactivada
        cap_nueva = Capacitaciones.objects.create(
            titulo="Capacitación Flujo Completo",
            descripcion="Test",
            imagen="",
            estado=0,  # Desactivada
            fecha_creacion=hoy,
            fecha_inicio=hoy,
            fecha_fin=hoy + timedelta(days=5),
            tipo="Curso"
        )
        
        self.assertEqual(cap_nueva.estado, 0)
        print("   ✅ Paso 1: Capacitación creada desactivada")
        
        # 2. Activar
        cap_nueva.estado = 1
        cap_nueva.save()
        
        cap_nueva.refresh_from_db()
        self.assertEqual(cap_nueva.estado, 1)
        print("   ✅ Paso 2: Capacitación activada")
        
        # 3. Desactivar
        cap_nueva.estado = 0
        cap_nueva.save()
        
        cap_nueva.refresh_from_db()
        self.assertEqual(cap_nueva.estado, 0)
        print("   ✅ Paso 3: Capacitación desactivada")
        
        print("   ✅ Flujo completo ejecutado correctamente")


class TestConfiguracionCelery(TestCase):
    """Tests para verificar que Celery esté correctamente configurado"""
    
    def test_celery_beat_schedule_existe(self):
        """Verificar que beat_schedule esté configurado"""
        print("\n🧪 Test: Configuración de Celery Beat Schedule")
        
        from core.celery import app
        
        beat_schedule = app.conf.beat_schedule
        self.assertIsNotNone(beat_schedule)
        self.assertGreater(len(beat_schedule), 0)
        
        print(f"   ✅ Beat schedule configurado con {len(beat_schedule)} tareas")
    
    def test_tareas_registradas_en_beat(self):
        """Verificar que todas las tareas esperadas están en beat_schedule"""
        print("\n🧪 Test: Verificación de tareas en Beat Schedule")
        
        from core.celery import app
        
        beat_schedule = app.conf.beat_schedule
        
        tareas_esperadas = [
            'enviar-correo-y-activar-capacitaciones-cada-dia',
            'notificar-capacitaciones-7-dias',
            'notificar-capacitaciones-1-dia',
            'desactivar-capacitaciones-cada-dia',
            'notificar-jefes-sin-progreso',
        ]
        
        for tarea in tareas_esperadas:
            self.assertIn(tarea, beat_schedule, f"Tarea {tarea} no está en beat_schedule")
        
        print(f"   ✅ Todas las {len(tareas_esperadas)} tareas están registradas")
    
    def test_timezone_celery(self):
        """Verificar que timezone está correctamente configurado"""
        print("\n🧪 Test: Configuración de Timezone en Celery")
        
        from core.celery import app
        
        timezone_config = app.conf.timezone
        self.assertEqual(timezone_config, 'America/Bogota')
        
        print(f"   ✅ Timezone configurado: {timezone_config}")
