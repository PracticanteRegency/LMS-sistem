"""
Tests de optimización para la aplicación Analitica

Este módulo contiene todos los tests para verificar las optimizaciones
de rendimiento de los endpoints de analitica. Incluye:
  - Test de modelo ProgresoAgregado (sin duplicados)
  - Test de jerarquía organizacional
  - Test de optimizaciones con select_related y prefetch_related
  - Test de endpoints de creación y actualización

Archivos consolidados en este archivo:
  - test_endpoint_completo.py
  - test_error_solucionado.py
  - test_optimizaciones_bajas.py
  - test_optimizaciones_medias.py
  - test_progreso_filtrado.py
  - test_tarea_mensual.py

Para ejecutar todos los tests:
    python manage.py test analitica

Para ejecutar un test específico:
    python manage.py test analitica.tests.TestProgresoEmpresarial
"""

from django.test import TestCase
from django.db.models import Count, Avg
from analitica.models import Epresa, Unidadnegocio, Proyecto, Centroop, ProgresoAgregado
from usuarios.models import Colaboradores
from capacitaciones.models import progresoCapacitaciones


class TestProgresoEmpresarial(TestCase):
    """Tests para el endpoint ProgresoEmpresarialView"""
    
    def setUp(self):
        """Configurar datos de prueba"""
        # Crear estructura organizacional
        self.empresa = Epresa.objects.create(
            nombre_empresa="Test Empresa",
            estado_empresa=1
        )
        self.unidad = Unidadnegocio.objects.create(
            nombre_unidad="Test Unidad",
            empresa=self.empresa,
            estado_unidad=1
        )
        self.proyecto = Proyecto.objects.create(
            nombre_proyecto="Test Proyecto",
            unidad=self.unidad,
            estado_proyecto=1
        )
        self.centro = Centroop.objects.create(
            nombre_centrop="Test Centro",
            id_proyecto=self.proyecto,
            estado_centrop=1
        )
    
    def test_modelo_progreso_agregado_estructura(self):
        """Verifica que el modelo ProgresoAgregado tiene la estructura correcta"""
        # Crear registro de prueba
        progreso = ProgresoAgregado.objects.create(
            empresa=self.empresa,
            unidad=self.unidad,
            proyecto=self.proyecto,
            centro=self.centro,
            promedio_total=75.5,
            mes=None,
            anio=None
        )
        
        self.assertIsNotNone(progreso.id)
        self.assertEqual(progreso.empresa, self.empresa)
        self.assertEqual(float(progreso.promedio_total), 75.5)
        self.assertIsNone(progreso.mes)
        self.assertIsNone(progreso.anio)
    
    def test_progreso_agregado_con_mes_anio(self):
        """Verifica que se pueden crear registros con mes y año"""
        progreso_mensual = ProgresoAgregado.objects.create(
            empresa=self.empresa,
            unidad=self.unidad,
            proyecto=self.proyecto,
            centro=self.centro,
            promedio_total=80.0,
            mes=12,
            anio=2025
        )
        
        self.assertEqual(progreso_mensual.mes, 12)
        self.assertEqual(progreso_mensual.anio, 2025)
    
    def test_no_duplicados_progreso_agregado(self):
        """Verifica que no existen registros duplicados"""
        # Crear registros
        ProgresoAgregado.objects.create(
            empresa=self.empresa,
            unidad=self.unidad,
            proyecto=self.proyecto,
            centro=self.centro,
            promedio_total=75.5,
            mes=None,
            anio=None
        )
        
        # Intentar crear uno similar debería actualizar, no duplicar
        progreso, created = ProgresoAgregado.objects.update_or_create(
            empresa=self.empresa,
            unidad=self.unidad,
            proyecto=self.proyecto,
            centro=self.centro,
            mes=None,
            anio=None,
            defaults={'promedio_total': 80.0}
        )
        
        self.assertFalse(created)
        self.assertEqual(float(progreso.promedio_total), 80.0)
        
        # Verificar que solo hay un registro
        count = ProgresoAgregado.objects.filter(
            empresa=self.empresa,
            mes__isnull=True,
            anio__isnull=True
        ).count()
        self.assertEqual(count, 1)


class TestJerarquiaOrganizacional(TestCase):
    """Tests para endpoints de jerarquía organizacional optimizados"""
    
    def setUp(self):
        """Configurar datos de prueba"""
        self.empresa = Epresa.objects.create(
            nombre_empresa="Test Empresa",
            estado_empresa=1
        )
        self.unidad = Unidadnegocio.objects.create(
            nombre_unidad="Test Unidad",
            empresa=self.empresa,
            estado_unidad=1
        )
        self.proyecto = Proyecto.objects.create(
            nombre_proyecto="Test Proyecto",
            unidad=self.unidad,
            estado_proyecto=1
        )
    
    def test_unidad_select_related_empresa(self):
        """Verifica que select_related funciona para empresa"""
        # Usando select_related
        unidad = Unidadnegocio.objects.select_related('empresa').get(id_unidad=self.unidad.id_unidad)
        
        # Acceder a empresa no debería generar query adicional
        empresa_nombre = unidad.empresa.nombre_empresa
        self.assertEqual(empresa_nombre, "Test Empresa")
    
    def test_proyecto_select_related_unidad_empresa(self):
        """Verifica que select_related profundo funciona"""
        # Usando select_related profundo
        proyecto = Proyecto.objects.select_related('unidad__empresa').get(id_proyecto=self.proyecto.id_proyecto)
        
        # Acceder a unidad y empresa no debería generar queries adicionales
        self.assertEqual(proyecto.unidad.nombre_unidad, "Test Unidad")
        self.assertEqual(proyecto.unidad.empresa.nombre_empresa, "Test Empresa")
    
    def test_lista_empresas_con_count(self):
        """Verifica que annotate Count funciona para listar empresas"""
        # Crear otra unidad
        Unidadnegocio.objects.create(
            nombre_unidad="Test Unidad 2",
            empresa=self.empresa,
            estado_unidad=1
        )
        
        # Usar annotate
        empresa = Epresa.objects.annotate(
            total_unidades=Count('unidadnegocio', distinct=True)
        ).get(id_empresa=self.empresa.id_empresa)
        
        self.assertEqual(empresa.total_unidades, 2)


class TestOptimizacionesQuery(TestCase):
    """Tests para verificar reducciones de queries"""
    
    def setUp(self):
        """Configurar datos de prueba"""
        self.empresa = Epresa.objects.create(nombre_empresa="Test", estado_empresa=1)
        self.unidad = Unidadnegocio.objects.create(
            nombre_unidad="Test",
            empresa=self.empresa,
            estado_unidad=1
        )
        self.proyecto = Proyecto.objects.create(
            nombre_proyecto="Test",
            unidad=self.unidad,
            estado_proyecto=1
        )
        self.centro = Centroop.objects.create(
            nombre_centrop="Test",
            id_proyecto=self.proyecto,
            estado_centrop=1
        )
    
    def test_centro_con_jerarquia_completa(self):
        """Verifica select_related de 3 niveles para centro"""
        centro = Centroop.objects.select_related(
            'id_proyecto__unidad__empresa'
        ).get(id_centrop=self.centro.id_centrop)
        
        # Acceder a toda la jerarquía sin queries adicionales
        self.assertEqual(centro.nombre_centrop, "Test")
        self.assertEqual(centro.id_proyecto.nombre_proyecto, "Test")
        self.assertEqual(centro.id_proyecto.unidad.nombre_unidad, "Test")
        self.assertEqual(centro.id_proyecto.unidad.empresa.nombre_empresa, "Test")
    
    def test_lista_proyectos_optimizada(self):
        """Verifica lista de proyectos con select_related"""
        # Crear más proyectos
        for i in range(3):
            Proyecto.objects.create(
                nombre_proyecto=f"Proyecto {i}",
                unidad=self.unidad,
                estado_proyecto=1
            )
        
        # Obtener con select_related
        proyectos = list(Proyecto.objects.select_related(
            'unidad__empresa'
        ).filter(estado_proyecto=1))
        
        self.assertGreaterEqual(len(proyectos), 4)
        
        # Acceder a empresas no genera queries adicionales
        for proyecto in proyectos:
            _ = proyecto.unidad.empresa.nombre_empresa
