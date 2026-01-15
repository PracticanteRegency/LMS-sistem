"""
Tests completos para endpoints de la app examenes
"""
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
import io
import csv

from analitica.models import Epresa, Unidadnegocio, Proyecto, Centroop
from usuarios.models import Cargo, Colaboradores, Usuarios
from examenes.models import Examen, ExamenesCargo, CorreoExamenEnviado, RegistroExamenes


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class ExamenesEndpointsTests(TestCase):
	"""Test completo de todos los endpoints de examenes"""
	
	def setUp(self):
		"""Configurar datos de prueba"""
		# Estructura jerárquica
		self.empresa = Epresa.objects.create(
			nitempresa='123456',
			nombre_empresa='Empresa Test',
			estadoempresa=1
		)
		self.unidad = Unidadnegocio.objects.create(
			nombreunidad='Unidad Test',
			descripcionunidad='Descripción',
			estadounidad=1,
			id_empresa=self.empresa
		)
		self.proyecto = Proyecto.objects.create(
			nombreproyecto='Proyecto Test',
			estadoproyecto=1,
			id_unidad=self.unidad
		)
		self.centro = Centroop.objects.create(
			nombrecentrop='Centro Test',
			estadocentrop=1,
			id_proyecto=self.proyecto
		)
		
		# Cargo
		self.cargo = Cargo.objects.create(
			nombrecargo='Operario',
			estadocargo=1
		)
		
		# Usuario especial (is_staff == 3)
		self.colab = Colaboradores.objects.create(
			cccolaborador='999888777',
			nombrecolaborador='Usuario Test',
			apellidocolaborador='Apellido',
			cargocolaborador=self.cargo,
			estadocolaborador=1
		)
		self.user = Usuarios(
			usuario='testuser',
			tipousuario=1,
			idcolaboradoru=self.colab
		)
		self.user.set_password('testpass123')
		self.user.save()
		
		# Exámenes activos
		self.examen1 = Examen.objects.create(
			nombre='Examen Médico General',
			activo=True
		)
		self.examen2 = Examen.objects.create(
			nombre='Audiometría',
			activo=True
		)
		
		# Relación ExamenesCargo
		ExamenesCargo.objects.create(
			empresa=self.empresa,
			cargo=self.cargo,
			examen=self.examen1
		)
		ExamenesCargo.objects.create(
			empresa=self.empresa,
			cargo=self.cargo,
			examen=self.examen2
		)
		
		# Cliente API
		self.client = APIClient()
		self.client.force_authenticate(user=self.user)
	
	def test_01_cargo_empresa_examenes_view(self):
		"""Test: GET /examenes/cargo-empresa-examenes/"""
		url = reverse('cargo-empresa-examenes')
		response = self.client.get(url)
		
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('empresas', response.data)
		
		empresas = response.data['empresas']
		self.assertGreater(len(empresas), 0)
	
	def test_02_enviar_correo_individual(self):
		"""Test: POST /examenes/correo/enviar/"""
		url = reverse('enviar-correo')
		
		data = {
			'empresa_id': self.empresa.idempresa,
			'cargo_id': self.cargo.idcargo,
			'nombre_trabajador': 'Juan Pérez',
			'documento_trabajador': '123456789',
			'correo_destino': 'juan.perez@test.com'
		}
		
		with patch('examenes.views.send_mail') as mock_send_mail:
			mock_send_mail.return_value = 1
			response = self.client.post(url, data, format='json')
		
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('mensaje', response.data)
		self.assertIn('uuid', response.data)
		
		# Verificar que se creó el registro
		correo = CorreoExamenEnviado.objects.filter(uuid_correo=response.data['uuid']).first()
		self.assertIsNotNone(correo)
	
	def test_03_enviar_correo_masivo(self):
		"""Test: POST /examenes/correo/enviar-masivo/"""
		url = reverse('enviar-correo-masivo')
		
		# Crear CSV en memoria
		csv_content = io.StringIO()
		writer = csv.writer(csv_content)
		writer.writerow(['Empresa', 'Unidad', 'Proyecto', 'Centro', 'Nombre', 'CC', 'Ciudad', 'Cargo'])
		writer.writerow([
			'Empresa Test',
			'Unidad Test',
			'Proyecto Test',
			'Centro Test',
			'Pedro López',
			'987654321',
			'Bogotá',
			'Operario'
		])
		
		csv_content.seek(0)
		csv_file = io.BytesIO(csv_content.getvalue().encode('utf-8'))
		csv_file.name = 'trabajadores.csv'
		
		data = {
			'archivo_csv': csv_file
		}
		
		with patch('examenes.views.EmailMultiAlternatives') as mock_email:
			mock_instance = MagicMock()
			mock_email.return_value = mock_instance
			mock_instance.send.return_value = 1
			
			response = self.client.post(url, data, format='multipart')
		
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertIn('uuid_correo', response.data)
	
	def test_04_reporte_correos_enviados(self):
		"""Test: GET /examenes/correo/reporte/"""
		# Crear correo de prueba
		correo1 = CorreoExamenEnviado.objects.create(
			enviado_por=self.colab,
			asunto='Test 1',
			cuerpo_correo='Cuerpo test',
			correos_destino='test@test.com',
			enviado_correctamente=True
		)
		
		RegistroExamenes.objects.create(
			correo_lote=correo1,
			nombre_trabajador='Test Worker',
			documento_trabajador='111111',
			empresa=self.empresa,
			cargo=self.cargo
		)
		
		url = reverse('reporte-correos')
		response = self.client.get(url)
		
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(len(response.data) > 0 or 'results' in response.data)
	
	def test_05_detalle_correo_enviado(self):
		"""Test: GET /examenes/correo/detalle/<id>/"""
		correo = CorreoExamenEnviado.objects.create(
			enviado_por=self.colab,
			asunto='Test Detalle',
			cuerpo_correo='Cuerpo detalle',
			correos_destino='detalle@test.com',
			enviado_correctamente=True
		)
		
		url = reverse('detalle-correo', kwargs={'correo_id': correo.id})
		response = self.client.get(url)
		
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('uuid_correo', response.data)

	def test_05b_cache_detalle_correo(self):
		"""Test: Cache HIT/MISS en detalle-correo"""
		correo = CorreoExamenEnviado.objects.create(
			enviado_por=self.colab,
			asunto='Cache Detalle',
			cuerpo_correo='Cuerpo',
			correos_destino='cache@test.com',
			enviado_correctamente=True
		)
		# Agregar al menos un trabajador para contenido
		RegistroExamenes.objects.create(
			correo_lote=correo,
			nombre_trabajador='Trabajador Cache',
			documento_trabajador='222222',
			empresa=self.empresa,
			cargo=self.cargo
		)

		url = reverse('detalle-correo', kwargs={'correo_id': correo.id}) + '?page=1&page_size=10'
		resp1 = self.client.get(url)
		self.assertEqual(resp1.status_code, status.HTTP_200_OK)
		self.assertEqual(resp1['X-Cache'], 'MISS')
		resp2 = self.client.get(url)
		self.assertEqual(resp2.status_code, status.HTTP_200_OK)
		self.assertEqual(resp2['X-Cache'], 'HIT')

	def test_05c_cache_listar_trabajadores(self):
		"""Test: Cache HIT/MISS en listar-trabajadores-correo"""
		correo = CorreoExamenEnviado.objects.create(
			enviado_por=self.colab,
			asunto='Cache Trabajadores',
			cuerpo_correo='Cuerpo',
			correos_destino='cache_trab@test.com',
			enviado_correctamente=True
		)
		RegistroExamenes.objects.create(
			correo_lote=correo,
			nombre_trabajador='Trab 1',
			documento_trabajador='111111',
			empresa=self.empresa,
			cargo=self.cargo
		)
		RegistroExamenes.objects.create(
			correo_lote=correo,
			nombre_trabajador='Trab 2',
			documento_trabajador='222222',
			empresa=self.empresa,
			cargo=self.cargo
		)

		url = reverse('listar-trabajadores-correo', kwargs={'correo_id': correo.id}) + '?page=1&page_size=10'
		resp1 = self.client.get(url)
		self.assertEqual(resp1.status_code, status.HTTP_200_OK)
		self.assertEqual(resp1['X-Cache'], 'MISS')
		resp2 = self.client.get(url)
		self.assertEqual(resp2.status_code, status.HTTP_200_OK)
		self.assertEqual(resp2['X-Cache'], 'HIT')
	
	def test_06_imprimir_reporte(self):
		"""Test: GET /examenes/imprimir-reporte/"""
		correo = CorreoExamenEnviado.objects.create(
			enviado_por=self.colab,
			asunto='Test Reporte',
			cuerpo_correo='Cuerpo',
			correos_destino='reporte@test.com',
			enviado_correctamente=True
		)
		
		RegistroExamenes.objects.create(
			correo_lote=correo,
			nombre_trabajador='Worker Excel',
			documento_trabajador='333333',
			empresa=self.empresa,
			cargo=self.cargo,
			centro=self.centro
		)
		
		url = reverse('imprimir-reporte')
		response = self.client.get(url)
		
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('.xlsx', response['Content-Disposition'])

	def test_07_cache_reporte_correos(self):
		"""Test: Cache HIT/MISS en reporte-correos"""
		# Crear algunos correos para poblar
		CorreoExamenEnviado.objects.create(
			enviado_por=self.colab,
			asunto='Rep 1',
			cuerpo_correo='Cuerpo',
			correos_destino='rep1@test.com',
			enviado_correctamente=True
		)
		CorreoExamenEnviado.objects.create(
			enviado_por=self.colab,
			asunto='Rep 2',
			cuerpo_correo='Cuerpo',
			correos_destino='rep2@test.com',
			enviado_correctamente=True
		)
		url = reverse('reporte-correos') + '?page=1&page_size=10'
		resp1 = self.client.get(url)
		self.assertEqual(resp1.status_code, status.HTTP_200_OK)
		self.assertEqual(resp1['X-Cache'], 'MISS')
		resp2 = self.client.get(url)
		self.assertEqual(resp2.status_code, status.HTTP_200_OK)
		self.assertEqual(resp2['X-Cache'], 'HIT')


class ModelTests(TestCase):
	"""Tests para modelos"""
	
	def setUp(self):
		self.empresa = Epresa.objects.create(
			nitempresa='111',
			nombre_empresa='Test',
			estadoempresa=1
		)
		self.cargo = Cargo.objects.create(nombrecargo='Test', estadocargo=1)
		self.colab = Colaboradores.objects.create(
			cccolaborador='111',
			nombrecolaborador='Test',
			apellidocolaborador='Test',
			cargocolaborador=self.cargo,
			estadocolaborador=1
		)
	
	def test_correo_genera_uuid(self):
		"""Test: CorreoExamenEnviado genera UUID al guardar"""
		correo = CorreoExamenEnviado.objects.create(
			enviado_por=self.colab,
			asunto='Test UUID',
			cuerpo_correo='Test',
			correos_destino='test@test.com'
		)
		
		self.assertIsNotNone(correo.uuid_correo)
		self.assertNotEqual(correo.uuid_correo, '')
	
	def test_registro_genera_uuid(self):
		"""Test: RegistroExamenes genera UUID al guardar"""
		correo = CorreoExamenEnviado.objects.create(
			enviado_por=self.colab,
			asunto='Test',
			cuerpo_correo='Test',
			correos_destino='test@test.com'
		)
		
		registro = RegistroExamenes.objects.create(
			correo_lote=correo,
			nombre_trabajador='Worker',
			documento_trabajador='123',
			empresa=self.empresa,
			cargo=self.cargo
		)
		
		self.assertIsNotNone(registro.uuid_trabajador)
		self.assertNotEqual(registro.uuid_trabajador, '')

