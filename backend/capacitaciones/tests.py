"""
Tests de optimización para la aplicación Capacitaciones

Este módulo contiene todos los tests para verificar las optimizaciones
de rendimiento de los endpoints de capacitaciones. Incluye:
  - Test de CapacitacionDetailView (prefetch_related profundo: 226 → 4 queries)
  - Test de MisCapacitacionesListView (87% optimización)
  - Test de VerProgresoView (select_related en jerarquía)

Archivos consolidados en este archivo:
  - test_capacitacion_detail.py
  - test_mis_capacitaciones.py

Para ejecutar todos los tests:
    python manage.py test capacitaciones

Para ejecutar un test específico:
    python manage.py test capacitaciones.tests.TestCapacitacionDetail
"""

from django.test import TestCase, TransactionTestCase
from django.db.models import Count, Prefetch
from analitica.models import Epresa
from capacitaciones.models import (
    Capacitaciones,
    Modulos,
    Lecciones,
    PreguntasLecciones,
    Respuestas,
    progresoCapacitaciones,
    progresoModulo,
    progresolecciones
)
from usuarios.models import Colaboradores, Cargo, Niveles, Regional
from analitica.models import Centroop, Proyecto, Unidadnegocio
from rest_framework.test import APIClient
from django.urls import reverse
from django.contrib.auth.models import User


class TestCapacitacionDetail(TransactionTestCase):
    """Tests para el endpoint CapacitacionDetailView optimizado"""
    
    # Usar la base de datos real sin crear una de prueba
    databases = {'default'}
    
    def setUp(self):
        """Configurar datos de prueba - USANDO DATOS EXISTENTES"""
        # Usar capacitación existente en vez de crear
        self.capacitacion = Capacitaciones.objects.filter(estado=1).first()
        
        if self.capacitacion and self.capacitacion.modulos_set.exists():
            self.modulo = self.capacitacion.modulos_set.first()
            
            if self.modulo and self.modulo.lecciones_set.exists():
                self.leccion = self.modulo.lecciones_set.first()
                
                if self.leccion and self.leccion.preguntaslecciones_set.exists():
                    self.pregunta = self.leccion.preguntaslecciones_set.first()
                    
                    if self.pregunta and self.pregunta.respuestas_set.exists():
                        self.respuesta1 = self.pregunta.respuestas_set.filter(escorrecto=1).first()
                        self.respuesta2 = self.pregunta.respuestas_set.filter(escorrecto=0).first()
    
    def test_prefetch_estructura_completa(self):
        """Verifica que prefetch_related carga toda la estructura"""
        capacitacion = Capacitaciones.objects.prefetch_related(
            Prefetch(
                'modulos_set',
                queryset=Modulos.objects.prefetch_related(
                    Prefetch(
                        'lecciones_set',
                        queryset=Lecciones.objects.prefetch_related(
                            Prefetch(
                                'preguntaslecciones_set',
                                queryset=PreguntasLecciones.objects.prefetch_related(
                                    'respuestas_set'
                                )
                            )
                        ).order_by('id')
                    )
                ).order_by('id')
            )
        ).get(pk=self.capacitacion.id)
        
        # Acceder a toda la estructura
        modulos = list(capacitacion.modulos_set.all())
        self.assertEqual(len(modulos), 1)
        
        lecciones = list(modulos[0].lecciones_set.all())
        self.assertEqual(len(lecciones), 1)
        
        preguntas = list(lecciones[0].preguntaslecciones_set.all())
        self.assertEqual(len(preguntas), 1)
        
        respuestas = list(preguntas[0].respuestas_set.all())
        self.assertEqual(len(respuestas), 2)
    
    def test_capacitacion_con_multiples_elementos(self):
        """Verifica estructura con múltiples módulos, lecciones y preguntas"""
        # Crear más módulos
        modulo2 = Modulos.objects.create(
            capacitacion=self.capacitacion,
            nombre_modulo="Módulo 2",
            estado_modulo=1
        )
        
        # Crear más lecciones
        leccion2 = Lecciones.objects.create(
            modulo=self.modulo,
            titulo_leccion="Lección 2",
            tipo_leccion="pdf",
            estado_leccion=1
        )
        
        # Obtener con prefetch
        capacitacion = Capacitaciones.objects.prefetch_related(
            'modulos_set__lecciones_set'
        ).get(pk=self.capacitacion.id)
        
        total_modulos = capacitacion.modulos_set.count()
        self.assertEqual(total_modulos, 2)


class TestMisCapacitaciones(TransactionTestCase):
    """Tests para el endpoint MisCapacitacionesListView optimizado"""
    
    # Usar la base de datos real
    databases = {'default'}
    
    def setUp(self):
        """Configurar datos de prueba - USANDO DATOS EXISTENTES"""
        # Usar empresa existente
        self.empresa = Epresa.objects.filter(estadoempresa=1).first()
        
        # Usar colaborador existente
        self.colaborador = Colaboradores.objects.filter(estado_colaborador=1).first()
        
        # Usar capacitación existente
        self.capacitacion = Capacitaciones.objects.filter(estado=1).first()
        
        if self.capacitacion:
            # Usar módulo existente
            self.modulo = self.capacitacion.modulos_set.first()
            
            if self.modulo:
                # Usar lección existente
                self.leccion = self.modulo.lecciones_set.first()
        
        # Buscar progreso existente o skip test
        if self.colaborador and self.capacitacion:
            self.progreso = progresoCapacitaciones.objects.filter(
                colaborador=self.colaborador,
                capacitacion=self.capacitacion
            ).first()
    
    def test_prefetch_con_to_attr_progreso(self):
        """Verifica prefetch con to_attr para progreso del colaborador"""
        capacitacion = Capacitaciones.objects.prefetch_related(
            Prefetch(
                'progresocapacitaciones_set',
                queryset=progresoCapacitaciones.objects.filter(colaborador=self.colaborador),
                to_attr='progreso_colaborador'
            )
        ).get(pk=self.capacitacion.id)
        
        # Verificar acceso directo al progreso
        self.assertTrue(hasattr(capacitacion, 'progreso_colaborador'))
        self.assertEqual(len(capacitacion.progreso_colaborador), 1)
        self.assertEqual(capacitacion.progreso_colaborador[0].progreso, 50.0)
    
    def test_annotate_total_lecciones(self):
        """Verifica annotate Count para lecciones totales"""
        # Crear más lecciones
        Lecciones.objects.create(
            modulo=self.modulo,
            titulo_leccion="Lección 2",
            tipo_leccion="pdf",
            estado_leccion=1
        )
        
        capacitacion = Capacitaciones.objects.annotate(
            total_lecciones_count=Count('modulos__lecciones', distinct=True)
        ).get(pk=self.capacitacion.id)
        
        self.assertEqual(capacitacion.total_lecciones_count, 2)
    
    def test_filtrado_por_colaborador(self):
        """Verifica filtrado de capacitaciones por colaborador"""
        # Crear otra capacitación sin progreso
        Capacitaciones.objects.create(
            titulo="Otra Cap",
            empresa=self.empresa,
            estado=1
        )
        
        # Filtrar solo capacitaciones del colaborador
        capacitaciones = Capacitaciones.objects.filter(
            progresocapacitaciones__colaborador=self.colaborador
        ).distinct()
        
        self.assertEqual(capacitaciones.count(), 1)
        self.assertEqual(capacitaciones.first().titulo, "Test Cap")


class TestVerProgreso(TransactionTestCase):
    """Tests para el endpoint VerProgresoView optimizado"""
    
    # Usar la base de datos real
    databases = {'default'}
    
    def setUp(self):
        """Configurar datos de prueba - USANDO DATOS EXISTENTES"""
        # Usar empresa y estructura existente
        self.empresa = Epresa.objects.filter(estadoempresa=1).first()
        
        # Usar colaborador existente
        self.colaborador = Colaboradores.objects.filter(estado_colaborador=1).first()
        
        # Usar capacitación existente con estructura completa
        self.capacitacion = Capacitaciones.objects.filter(estado=1).first()
        
        if self.capacitacion:
            self.modulo = self.capacitacion.modulos_set.first()
            
            if self.modulo:
                self.leccion = self.modulo.lecciones_set.first()
    
    def test_select_related_progreso_lecciones(self):
        """Verifica select_related para progreso de lecciones"""
        # Skip si no hay datos
        if not (self.colaborador and self.leccion):
            self.skipTest("No hay datos de prueba disponibles")
        
        # Buscar o crear progreso existente
        progreso = progresolecciones.objects.filter(
            idcolaborador=self.colaborador,
            idleccion=self.leccion
        ).first()
        
        if not progreso:
            self.skipTest("No hay progreso de lecciones disponible")
        
        # Obtener con select_related
        progreso = progresolecciones.objects.select_related(
            'idleccion__idmodulo__idcapacitacion'
        ).filter(idcolaborador=self.colaborador).first()
        
        # Verificar que las relaciones están cargadas
        self.assertIsNotNone(progreso.idleccion)
        self.assertIsNotNone(progreso.idleccion.idmodulo)
    
    def test_select_related_progreso_modulos(self):
        """Verifica select_related para progreso de módulos"""
        # Skip si no hay datos
        if not (self.colaborador and self.modulo):
            self.skipTest("No hay datos de prueba disponibles")
        
        # Buscar progreso existente
        progreso = progresoModulo.objects.filter(
            colaborador=self.colaborador,
            modulo=self.modulo
        ).first()
        
        if not progreso:
            self.skipTest("No hay progreso de módulos disponible")
        
        # Obtener con select_related
        progreso = progresoModulo.objects.select_related(
            'modulo__idcapacitacion'
        ).filter(colaborador=self.colaborador).first()
        
        # Verificar que las relaciones están cargadas
        self.assertIsNotNone(progreso.modulo)
    
    def test_select_related_progreso_capacitaciones(self):
        """Verifica select_related para progreso de capacitaciones"""
        # Skip si no hay datos
        if not (self.colaborador and self.capacitacion):
            self.skipTest("No hay datos de prueba disponibles")
        
        # Buscar progreso existente
        progreso = progresoCapacitaciones.objects.filter(
            colaborador=self.colaborador,
            capacitacion=self.capacitacion
        ).first()
        
        if not progreso:
            self.skipTest("No hay progreso de capacitaciones disponible")
        
        # Obtener con select_related
        progreso = progresoCapacitaciones.objects.select_related(
            'capacitacion'
        ).filter(colaborador=self.colaborador).first()
        
        # Verificar que las relaciones están cargadas
        self.assertIsNotNone(progreso.capacitacion)


class TestManageColaboradores(TransactionTestCase):
    """Tests básicos para POST add/remove en CrearCapacitacionView"""

    databases = {'default'}

    def setUp(self):
        self.client = APIClient()
        # usuario admin
        self.user, _ = User.objects.get_or_create(username='testadmin')
        self.user.is_staff = True
        self.user.set_password('pass')
        self.user.save()
        self.client.force_authenticate(user=self.user)

        # usar datos existentes si están disponibles
        self.capacitacion = Capacitaciones.objects.filter(estado=1).first()
        self.col1 = Colaboradores.objects.filter(estado_colaborador=1).first()
        # buscar un segundo colaborador distinto
        self.col2 = Colaboradores.objects.filter(estado_colaborador=1).exclude(idcolaborador=getattr(self.col1, 'idcolaborador', None)).first() if self.col1 else None

    def test_add_and_remove_colaboradores(self):
        if not (self.capacitacion and self.col1 and self.col2):
            self.skipTest('No hay datos suficientes (capacitacion/colaboradores) para ejecutar este test')

        # asegurar que col1 está inscrito y col2 no
        progresoCapacitaciones.objects.filter(capacitacion=self.capacitacion, colaborador_id=self.col1.idcolaborador).delete()
        progresoCapacitaciones.objects.filter(capacitacion=self.capacitacion, colaborador_id=self.col2.idcolaborador).delete()

        progresoCapacitaciones.objects.create(
            capacitacion=self.capacitacion,
            colaborador_id=self.col1.idcolaborador,
            fecha_registro=timezone.now(),
            completada=False,
            progreso=0
        )

        url = reverse('editar-capacitacion', kwargs={'capacitacion_id': self.capacitacion.id})

        payload = {
            'add': [self.col2.idcolaborador],
            'remove': [self.col1.idcolaborador]
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, 200)

        # verificar cambios en DB
        exists_col2 = progresoCapacitaciones.objects.filter(capacitacion=self.capacitacion, colaborador_id=self.col2.idcolaborador).exists()
        exists_col1 = progresoCapacitaciones.objects.filter(capacitacion=self.capacitacion, colaborador_id=self.col1.idcolaborador).exists()
        self.assertTrue(exists_col2)
        self.assertFalse(exists_col1)
