#!/usr/bin/env python
"""
Script para probar el endpoint de resolver predicción especial.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from mundial.models import ConfiguracionPrediccionEspecial, Equipo
import json

User = get_user_model()

# Crear cliente API
client = APIClient()

# Obtener o crear un usuario admin
try:
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.create_superuser('admin', 'admin@test.com', 'password')
        print(f"✓ Usuario admin creado: {admin_user}")
    else:
        print(f"✓ Usuario admin encontrado: {admin_user}")
except Exception as e:
    print(f"✗ Error creando usuario: {e}")
    sys.exit(1)

# Login
client.force_authenticate(user=admin_user)

# Obtener una predicción especial bloqueada
config = ConfiguracionPrediccionEspecial.objects.filter(estado='bloqueada').first()
if not config:
    print("✗ No hay predicciones especiales bloqueadas")
    sys.exit(1)

print(f"✓ Predicción especial encontrada: {config} (ID: {config.id})")

# Obtener un equipo
equipo = Equipo.objects.first()
if not equipo:
    print("✗ No hay equipos disponibles")
    sys.exit(1)

print(f"✓ Equipo encontrado: {equipo} (ID: {equipo.id})")

# Probar el endpoint
url = f"/api/mundial/configuracion-especiales/{config.id}/resolver/"

# Preparar payload
if config.tipo in ["campeon", "subcampeon", "tercer_lugar"]:
    payload = {"resultado_equipo": equipo.id}
else:
    payload = {"resultado_jugador": "Test Player"}

print(f"\n📤 Enviando POST a {url}")
print(f"   Payload: {json.dumps(payload, indent=2)}")

# Hacer request
response = client.post(url, data=payload, format='json')

print(f"\n📥 Response:")
print(f"   Status: {response.status_code}")
print(f"   Data: {json.dumps(response.data, indent=2)}")

if response.status_code == 200:
    print("\n✓ ¡Éxito! El endpoint funcionó correctamente.")
else:
    print(f"\n✗ Error: Status {response.status_code}")

sys.exit(0 if response.status_code == 200 else 1)
