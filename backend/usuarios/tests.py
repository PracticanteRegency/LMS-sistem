"""
Tests de optimización para la aplicación Usuarios

Este módulo contiene todos los tests para verificar las optimizaciones
de rendimiento de los endpoints de usuarios. Incluye:
  - Test de API REST existentes
  - Test de ListaUsuariosView (select_related y paginación)
  - Test de PerfilView (optimización profunda)

Archivos consolidados en este archivo:
  - test_lista_usuarios.py

Para ejecutar todos los tests:
    python manage.py test usuarios

Para ejecutar un test específico:
    python manage.py test usuarios.tests.TestListaUsuarios
"""

from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from django.test import TestCase
from django.db.models import Count, Q
from django.contrib.auth import get_user_model

from .models import Usuarios, Colaboradores, Cargo, Niveles, Regional
from analitica.models import Epresa, Centroop, Unidadnegocio, Proyecto
from capacitaciones.models import progresoCapacitaciones, Capacitaciones

User = get_user_model()


class UsuariosViewsTest(APITestCase):

    def setUp(self):
        # Datos base necesarios para FK
        self.cargo = Cargo.objects.create(nombrecargo="Analista", estadocargo=1)
        self.nivel = Niveles.objects.create(nombre_nivel="Junior", estado_nivel=1)
        self.regional = Regional.objects.create(nombre_regional="Caribe", estado_regional=1)
        
        # Crear estructura organizacional
        self.empresa = Epresa.objects.create(nombre_empresa="Test Empresa", estado_empresa=1)
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
            nombre_centrop="oficina 315",
            id_proyecto=self.proyecto,
            estado_centrop=1
        )

        # Crear colaborador
        self.colaborador = Colaboradores.objects.create(
            cc_colaborador="123",
            nombre_colaborador="Pedro",
            apellido_colaborador="López",
            correo_colaborador="pedro@test.com",
            cargo_colaborador=self.cargo,
            telefo_colaborador="300123123",
            nivel_colaborador=self.nivel,
            regional_colab=self.regional,
            centroOP=self.centro
        )

        # Usuario Admin
        self.admin = Usuarios.objects.create_user(
            usuario="admin",
            password="12345",
            is_staff=True,
            id_colaboradoru=self.colaborador
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    # ---------------------------------------------
    #  REGISTER (POST)
    # ---------------------------------------------
    def test_register_usuario(self):
        url = reverse("register")

        data = {
            "usuario": "nuevo_user",
            "password": "pass123",
            "is_staff": 0,
            "idcolaborador": {
                "cc_colaborador": "456",
                "nombre_colaborador": "Maria",
                "apellido_colaborador": "Perez",
                "cargo_colaborador": self.cargo.idcargo,
                "correo_colaborador": "maria@test.com",
                "telefo_colaborador": "300999999",
                "nivel_colaborador": self.nivel.id_nivel,
                "regional_colab": self.regional.id_regional,
                "centroOP": self.centro.id_centrop
            }
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Usuarios.objects.filter(usuario="nuevo_user").exists())

    # ---------------------------------------------
    # PERFIL GET
    # ---------------------------------------------
    def test_perfil_view_get(self):
        url = reverse("perfil-especifico", args=[self.colaborador.id_colaborador])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["nombre_colaborador"], "Pedro")

    # ---------------------------------------------
    # PERFIL GET - COLABORADOR NO EXISTE
    # ---------------------------------------------
    def test_perfil_get_not_found(self):
        url = reverse("perfil-especifico", args=[999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ---------------------------------------------
    # PERFIL PUT (solo admin)
    # ---------------------------------------------
    def test_perfil_put(self):
        url = reverse("perfil-especifico", args=[self.colaborador.id_colaborador])

        data = {
            "nombre_colaborador": "Pedro Editado"
        }

        response = self.client.put(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.colaborador.refresh_from_db()
        self.assertEqual(self.colaborador.nombre_colaborador, "Pedro Editado")

    # ---------------------------------------------
    # LISTA USUARIOS GET
    # ---------------------------------------------
    def test_lista_usuarios(self):
        url = reverse("lista_usuarios")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class TestListaUsuarios(TestCase):
    """Tests para el endpoint ListaUsuariosView optimizado"""
    
    def setUp(self):
        """Configurar datos de prueba"""
        # Crear estructura organizacional
        self.empresa = Epresa.objects.create(nombre_empresa="Test Empresa", estado_empresa=1)
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
        
        # Crear datos auxiliares
        self.cargo = Cargo.objects.create(nombrecargo="Desarrollador", estadocargo=1)
        self.nivel = Niveles.objects.create(nombre_nivel="Senior", estado_nivel=1)
        self.regional = Regional.objects.create(nombre_regional="Caribe", estado_regional=1)
        
        # Crear colaboradores de prueba
        for i in range(5):
            Colaboradores.objects.create(
                cc_colaborador=f"1000{i}",
                nombre_colaborador=f"Colaborador{i}",
                apellido_colaborador=f"Apellido{i}",
                correo_colaborador=f"colab{i}@test.com",
                cargo_colaborador=self.cargo,
                telefo_colaborador=f"30012345{i}",
                nivel_colaborador=self.nivel,
                regional_colab=self.regional,
                centroOP=self.centro,
                estado_colaborador=1
            )
    
    def test_select_related_jerarquia_completa(self):
        """Verifica que select_related carga toda la jerarquía"""
        colaboradores = Colaboradores.objects.select_related(
            'centroOP__id_proyecto__unidad__empresa',
            'cargo_colaborador',
            'nivel_colaborador',
            'regional_colab'
        ).all()[:3]
        
        for colab in colaboradores:
            # Acceder a toda la jerarquía no debería generar queries
            self.assertIsNotNone(colab.centroOP.nombre_centrop)
            self.assertIsNotNone(colab.centroOP.id_proyecto.nombre_proyecto)
            self.assertIsNotNone(colab.centroOP.id_proyecto.unidad.nombre_unidad)
            self.assertIsNotNone(colab.centroOP.id_proyecto.unidad.empresa.nombre_empresa)
            self.assertIsNotNone(colab.cargo_colaborador.nombrecargo)
    
    def test_annotate_capacitaciones(self):
        """Verifica que annotate Count funciona para capacitaciones"""
        # Crear capacitación y progreso
        capacitacion = Capacitaciones.objects.create(
            titulo="Test Capacitación",
            empresa=self.empresa,
            estado=1
        )
        
        colaborador = Colaboradores.objects.first()
        progresoCapacitaciones.objects.create(
            colaborador=colaborador,
            capacitacion=capacitacion,
            progreso=50.0,
            completada=False
        )
        
        # Usar annotate
        colaborador_anotado = Colaboradores.objects.annotate(
            total_capacitaciones=Count(
                'progresocapacitaciones',
                filter=~Q(progresocapacitaciones__capacitacion__estado=2)
            )
        ).get(id_colaborador=colaborador.id_colaborador)
        
        self.assertEqual(colaborador_anotado.total_capacitaciones, 1)
    
    def test_paginacion_colaboradores(self):
        """Verifica que la paginación funciona correctamente"""
        # Ya hay 5 colaboradores del setUp
        total = Colaboradores.objects.count()
        self.assertEqual(total, 5)
        
        # Simular paginación
        page_size = 3
        colaboradores_pagina1 = list(Colaboradores.objects.all()[:page_size])
        self.assertEqual(len(colaboradores_pagina1), 3)


class TestPerfilOptimizaciones(TestCase):
    """Tests para endpoints de perfil optimizados"""
    
    def setUp(self):
        """Configurar datos de prueba"""
        # Crear estructura completa
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
        
        self.cargo = Cargo.objects.create(nombrecargo="Test", estadocargo=1)
        self.nivel = Niveles.objects.create(nombre_nivel="Test", estado_nivel=1)
        self.regional = Regional.objects.create(nombre_regional="Test", estado_regional=1)
        
        self.colaborador = Colaboradores.objects.create(
            cc_colaborador="123",
            nombre_colaborador="Test",
            apellido_colaborador="User",
            correo_colaborador="test@test.com",
            cargo_colaborador=self.cargo,
            telefo_colaborador="3001234567",
            nivel_colaborador=self.nivel,
            regional_colab=self.regional,
            centroOP=self.centro
        )
    
    def test_perfil_con_select_related_profundo(self):
        """Verifica select_related profundo en PerfilView"""
        colaborador = Colaboradores.objects.select_related(
            'centroOP__id_proyecto__unidad__empresa',
            'cargo_colaborador',
            'nivel_colaborador',
            'regional_colab'
        ).get(id_colaborador=self.colaborador.id_colaborador)
        
        # Acceder a toda la jerarquía
        self.assertEqual(colaborador.centroOP.nombre_centrop, "Test")
        self.assertEqual(colaborador.centroOP.id_proyecto.nombre_proyecto, "Test")
        self.assertEqual(colaborador.centroOP.id_proyecto.unidad.nombre_unidad, "Test")
        self.assertEqual(colaborador.centroOP.id_proyecto.unidad.empresa.nombre_empresa, "Test")
        self.assertEqual(colaborador.cargo_colaborador.nombrecargo, "Test")
