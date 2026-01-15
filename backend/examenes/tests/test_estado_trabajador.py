from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from examenes.models import CorreoExamenEnviado, RegistroExamenes, ExamenTrabajador, Examen, RegistroExamenesEnviados
from usuarios.models import Cargo
from analitica.models import Epresa, Unidadnegocio, Proyecto, Centroop
from usuarios.models import Usuarios, Colaboradores
# Note: no UnmanagedModelsMixin required; migrations provide necessary tables
from django.db import connection


class RegistroExamenesBehaviorTests(TestCase):
	def setUp(self):
		# call mixin setUp if needed and prepare client
		# Crear tablas mínimas necesarias para modelos unmanaged (analitica/examenes)
		cursor = connection.cursor()
		cursor.execute('''
			CREATE TABLE IF NOT EXISTS epresa (
				Idempresa INTEGER PRIMARY KEY AUTOINCREMENT,
				nitempresa VARCHAR(20),
				nombre_empresa VARCHAR(150),
				estadoempresa INTEGER
			)
		''')
		cursor.execute('''
			CREATE TABLE IF NOT EXISTS unidadnegocio (
				idunidad INTEGER PRIMARY KEY AUTOINCREMENT,
				nombreunidad VARCHAR(30),
				descripcionUnidad VARCHAR(100),
				estadoUnidad INTEGER,
				id_empresa INTEGER
			)
		''')
		cursor.execute('''
			CREATE TABLE IF NOT EXISTS proyecto (
				Idproyecto INTEGER PRIMARY KEY AUTOINCREMENT,
				nombreProyecto VARCHAR(50),
				estadoProyecto INTEGER,
				Id_unidad INTEGER,
				idColaborador INTEGER
			)
		''')
		cursor.execute('''
			CREATE TABLE IF NOT EXISTS centroop (
				idCentrOp INTEGER PRIMARY KEY AUTOINCREMENT,
				nombreCentrOp VARCHAR(30),
				estadoCentrOp INTEGER,
				Id_proyecto INTEGER
			)
		''')
		cursor.execute('''
			CREATE TABLE IF NOT EXISTS cargo (
				idcargo INTEGER PRIMARY KEY AUTOINCREMENT,
				nombrecargo VARCHAR(30),
				estadocargo INTEGER DEFAULT 1
			)
		''')
		cursor.execute('''
			CREATE TABLE IF NOT EXISTS colaboradores (
				idColaborador INTEGER PRIMARY KEY AUTOINCREMENT,
				ccColaborador VARCHAR(30),
				nombreColaborador VARCHAR(30),
				apellidoColaborador VARCHAR(30),
				id_centroop INTEGER,
				cargoColaborador INTEGER,
				correoColaborador VARCHAR(50),
				telefoColaborador VARCHAR(20),
				estadocolaborador INTEGER DEFAULT 1,
				nivelcolaborador INTEGER,
				regionalcolab INTEGER
			)
		''')
		cursor.execute('''
			CREATE TABLE IF NOT EXISTS examenes (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				nombre VARCHAR(150),
				activo INTEGER DEFAULT 1
			)
		''')

		self.client = APIClient()

		# Crear datos basicos
		self.empresa = Epresa.objects.create(nitempresa='999', nombre_empresa='EmpresaTest', estadoempresa=1)
		self.unidad = Unidadnegocio.objects.create(nombreunidad='U1', descripcionunidad='d', estadounidad=1, id_empresa=self.empresa)
		self.proyecto = Proyecto.objects.create(nombreproyecto='P1', estadoproyecto=1, id_unidad=self.unidad)
		self.centro = Centroop.objects.create(nombrecentrop='C1', estadocentrop=1, id_proyecto=self.proyecto)

		self.cargo = Cargo.objects.create(nombrecargo='Operario')
		self.examen = Examen.objects.create(nombre='Examen Test', activo=True)

		# Crear colaborador y usar un usuario 'simulado' para evitar dependencia
		# de la tabla `usuarios` (puede ser unmanaged en este proyecto)
		colaborador = Colaboradores.objects.create(cccolaborador='900', nombrecolaborador='T', apellidocolaborador='U', cargocolaborador=self.cargo, correocolaborador='a@b.com')
		# Usuario simulado con atributos esperados por permisos
		from types import SimpleNamespace
		self.user = SimpleNamespace(is_authenticated=True, tipousuario=3, idcolaboradoru=colaborador)

	def _auth(self):
		# Forzar autenticación con usuario simulado
		self.client.force_authenticate(user=self.user)

	def test_single_send_creates_examentrabajador_and_not_registroenviados(self):
		self._auth()

		payload = {
			'nombre_trabajador': 'Juan',
			'documento_trabajador': '800',
			'correo_destino': 'juan@test.com',
			'centro_id': self.centro.idcentrop,
			'cargo_id': self.cargo.idcargo,
			'tipo_examen': 'INGRESO',
			'examenes_ids': [self.examen.id_examen]
		}

		resp = self.client.post(reverse('enviar-correo'), payload, format='json')
		self.assertIn(resp.status_code, (200, 201))

		registro = RegistroExamenes.objects.filter(documento_trabajador='800').first()
		self.assertIsNotNone(registro)
		# estado default pendiente (0)
		self.assertEqual(registro.estado_trabajador, 0)

		# ExamenTrabajador debe haberse creado
		self.assertTrue(ExamenTrabajador.objects.filter(registro_examen=registro).exists())

		# No deben haberse creado registros en RegistroExamenesEnviados
		self.assertEqual(RegistroExamenesEnviados.objects.filter(registro_examen=registro).count(), 0)

	def test_list_shows_examenes_from_examentrabajador(self):
		# crear registro y relacion manualmente
		correo = CorreoExamenEnviado.objects.create(enviado_por=self.user.idcolaboradoru, asunto='a', cuerpo_correo='', correos_destino='', tipo_examen='INGRESO')
		reg = RegistroExamenes.objects.create(correo_lote=correo, nombre_trabajador='Ana', documento_trabajador='801', empresa=self.empresa, cargo=self.cargo, tipo_examen='INGRESO', examenes_asignados='Examen Test')
		ExamenTrabajador.objects.create(registro_examen=reg, examen=self.examen)

		self._auth()
		r = self.client.get(reverse('listar-trabajadores-correo', args=[correo.id]) + '?page=1&page_size=10')
		self.assertEqual(r.status_code, 200)
		data = r.json()
		results = data.get('results', [])
		self.assertTrue(results)
		first = results[0]
		self.assertIn('examenes', first)
		self.assertTrue(any(e['examen_nombre'] == 'Examen Test' for e in first['examenes']))
