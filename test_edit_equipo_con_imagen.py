#!/usr/bin/env python
"""
Test de edición de equipo CON imagen nueva
Simula lo que hace el frontend:
1. Obtiene un equipo existente
2. Prepara FormData con nombre, emoji, imagen nueva
3. Hace PUT al endpoint
4. Verifica que la imagen se guarde en media
"""
import os
import sys
import django
import io
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, '/app')
django.setup()

from django.core.files.uploadedfile import InMemoryUploadedFile
from django.test import Client
from django.contrib.auth.models import User
from PIL import Image
from mundial.models import Equipo
import json

print("=" * 70)
print("TEST: EDITAR EQUIPO CON IMAGEN NUEVA")
print("=" * 70)

# 1. Obtener o crear usuario admin
try:
    admin_user = User.objects.get(username='admin')
except User.DoesNotExist:
    admin_user = User.objects.create_superuser('admin', 'admin@test.com', 'admin')
    print("✅ Admin creado")

# 2. Obtener un equipo para editar
equipos = Equipo.objects.all()[:5]
if not equipos.exists():
    print("❌ No hay equipos en la BD para editar")
    sys.exit(1)

equipo = equipos[0]
print(f"\n📋 Equipo a editar: {equipo.nombre} (ID: {equipo.id})")
print(f"   - Imagen actual: {equipo.bandera_imagen}")
print(f"   - URL actual: {equipo.bandera_url}")
print(f"   - Emoji actual: {equipo.bandera_emoji}")

# 3. Crear una imagen de prueba (PNG pequeño)
def create_test_image():
    """Crea una imagen PNG pequeña en memoria"""
    image = Image.new('RGB', (100, 100), color='red')
    image_io = io.BytesIO()
    image.save(image_io, format='PNG')
    image_io.seek(0)
    return image_io

test_image = create_test_image()

# 4. Preparar datos para PUT (igual que frontend)
client = Client()
client.force_login(admin_user)

# Crear archivo simulado como InMemoryUploadedFile (igual a lo que Django recibe)
imagen_file = InMemoryUploadedFile(
    test_image,
    'bandera_imagen',
    'test_image_edit.png',
    'image/png',
    test_image.getbuffer().nbytes,
    None
)

# 5. Hacer PUT al endpoint
put_url = f'/api/equipos/{equipo.id}/'
print(f"\n🔄 Enviando PUT a: {put_url}")
print(f"   Datos: nombre={equipo.nombre}, emoji={equipo.bandera_emoji or 'none'}, imagen=test_image_edit.png")

response = client.put(
    put_url,
    data={
        'nombre': equipo.nombre,
        'bandera_emoji': equipo.bandera_emoji or '',
        'bandera_imagen': imagen_file,
        'activo': True
    },
    HTTP_AUTHORIZATION=f'Bearer {admin_user.auth_token.key if hasattr(admin_user, "auth_token") else ""}'
)

print(f"\n📊 Respuesta:")
print(f"   Status: {response.status_code}")
print(f"   Content-Type: {response.get('Content-Type', 'N/A')}")

if response.status_code in [200, 201]:
    try:
        data = response.json()
        print(f"   ✅ Respuesta JSON:")
        print(f"      - nombre: {data.get('nombre')}")
        print(f"      - bandera_imagen: {data.get('bandera_imagen')}")
        print(f"      - bandera_url: {data.get('bandera_url')}")
        print(f"      - bandera_emoji: {data.get('bandera_emoji')}")
        print(f"      - bandera (property): {data.get('bandera')}")
    except Exception as e:
        print(f"   ⚠️  Error parseando JSON: {e}")
        print(f"   Raw: {response.content.decode('utf-8')[:200]}")
else:
    print(f"   ❌ Error en respuesta:")
    try:
        error_data = response.json()
        print(f"   {json.dumps(error_data, indent=2)}")
    except:
        print(f"   Raw: {response.content.decode('utf-8')}")

# 6. Verificar en base de datos
print(f"\n🔍 Verificando en base de datos:")
equipo.refresh_from_db()
print(f"   - Imagen: {equipo.bandera_imagen}")
print(f"   - URL: {equipo.bandera_url}")

# 7. Verificar si el archivo está en el sistema de archivos
if equipo.bandera_imagen:
    media_path = equipo.bandera_imagen.path if hasattr(equipo.bandera_imagen, 'path') else None
    if media_path:
        file_exists = os.path.exists(media_path)
        print(f"   - Archivo en disk: {media_path}")
        print(f"   - ¿Existe? {'✅ SÍ' if file_exists else '❌ NO'}")
        if file_exists:
            file_size = os.path.getsize(media_path)
            print(f"   - Tamaño: {file_size} bytes")

print("\n" + "=" * 70)
print("FIN TEST")
print("=" * 70)
