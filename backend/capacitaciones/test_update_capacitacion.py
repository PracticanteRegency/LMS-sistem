from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from usuarios.models import Usuarios, Colaboradores
from capacitaciones.models import Capacitaciones, Modulos, Lecciones, progresoCapacitaciones


class TestUpdateCapacitacion(APITestCase):
    """Tests para actualizar/sincronizar capacitaciones (módulos, lecciones, colaboradores)"""
    databases = {'default'}

    def setUp(self):
        self.client = APIClient()
        self.cap = Capacitaciones.objects.filter().first()
        if not self.cap:
            self.skipTest("No hay capacitaciones en la base de datos")

        self.admin_user = Usuarios.objects.filter(tipousuario__in=[1, 4]).first()
        if not self.admin_user:
            self.skipTest("No hay usuario admin disponible para tests")

        # Necesitamos al menos dos colaboradores para probar add/remove
        cols = list(Colaboradores.objects.filter(estadocolaborador=1)[:3])
        if len(cols) < 2:
            self.skipTest("No hay suficientes colaboradores en la base de datos para la prueba")
        self.col1 = cols[0]
        self.col2 = cols[1]

    def test_patch_update_modules_and_sync_collaborators(self):
        self.client.force_authenticate(user=self.admin_user)
        # Ensure col1 is not enrolled, col2 is enrolled (to test add/remove)
        progresoCapacitaciones.objects.filter(capacitacion=self.cap, colaborador=self.col1).delete()
        # Ensure col2 is enrolled
        progresoCapacitaciones.objects.get_or_create(capacitacion=self.cap, colaborador=self.col2, defaults={
            'fecha_registro': '2000-01-01T00:00:00', 'completada': False, 'progreso': 0
        })

        payload = {
            'titulo': 'Titulo actualizado desde test',
            'modulos': [
                {
                    'nombre_modulo': 'Modulo Test 1',
                    'lecciones': [
                        {'titulo_leccion': 'Leccion A', 'tipo_leccion': 'pdf', 'url': ''}
                    ]
                }
            ],
            'colaboradores': [self.col1.idcolaborador]  # keep only col1 -> should add col1 and remove col2
        }

        url = f"/crear-capacitacion/{self.cap.id}/"
        resp = self.client.patch(url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        # Refresh and validate
        self.cap.refresh_from_db()
        self.assertEqual(self.cap.titulo, 'Titulo actualizado desde test')

        mods = Modulos.objects.filter(idcapacitacion=self.cap)
        self.assertEqual(mods.count(), 1)
        mod = mods.first()
        lecs = Lecciones.objects.filter(idmodulo=mod)
        self.assertTrue(lecs.filter(tituloleccion='Leccion A').exists())

        # Collaborators: col1 should be enrolled, col2 should be removed
        self.assertTrue(progresoCapacitaciones.objects.filter(capacitacion=self.cap, colaborador=self.col1).exists())
        self.assertFalse(progresoCapacitaciones.objects.filter(capacitacion=self.cap, colaborador=self.col2).exists())
