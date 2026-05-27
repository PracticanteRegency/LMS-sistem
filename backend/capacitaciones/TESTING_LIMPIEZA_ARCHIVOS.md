# Guía de Testing - Limpieza de Archivos Huérfanos

## Descripción

La tarea Celery `limpiar_directorio_certificados` ha sido actualizada para limpiar no solo certificados, sino también archivos huérfanos de capacitaciones, incluyendo:

- Imágenes de capacitaciones eliminadas
- PDFs de lecciones eliminadas
- Imágenes de preguntas eliminadas
- Imágenes de respuestas eliminadas
- Certificados huérfanos

**Criterios de eliminación:**
- Archivo no referenciado en BD
- Más antiguo de 24 horas
- En almacenamiento local (NO en Cloudinary)

---

## Ejecución Manual

### 1. Ejecutar desde Django Shell

```bash
python manage.py shell
```

Luego:

```python
from capacitaciones.tasks import limpiar_directorio_certificados

# Ejecutar tarea
resultado = limpiar_directorio_certificados()

# Ver resultado
print(resultado)
# Output:
# {
#     'eliminados_total': 5,
#     'errores_total': 0,
#     'detalles': {
#         'certificados': {'eliminados': 1, 'errores': 0},
#         'capacitaciones': {'eliminados': 2, 'errores': 0},
#         'lecciones': {'eliminados': 2, 'errores': 0},
#         'preguntas': {'eliminados': 0, 'errores': 0},
#         'respuestas': {'eliminados': 0, 'errores': 0}
#     },
#     'mensaje': 'Se eliminaron 5 archivos huérfanos en total'
# }
```

### 2. Ejecutar desde Celery

```bash
celery -A core call capacitaciones.tasks.limpiar_directorio_certificados
```

---

## Verificación Manual

### 1. Crear un archivo huérfano de prueba

```bash
# Crear archivo de prueba en capacitaciones
touch /ruta/media/capacitaciones/test_huerfano.png

# Esperar 24+ horas, o cambiar fecha de creación
touch -t 202501010000 /ruta/media/capacitaciones/test_huerfano.png
```

### 2. Ejecutar limpieza

```python
from capacitaciones.tasks import limpiar_directorio_certificados
resultado = limpiar_directorio_certificados()
```

### 3. Verificar que se eliminó

```bash
ls -la /ruta/media/capacitaciones/test_huerfano.png
# Debe dar: No such file or directory
```

---

## Casos de Test

### Caso 1: Archivo de Capacitación Eliminada

```python
from capacitaciones.models import Capacitaciones

# 1. Crear capacitación con imagen
cap = Capacitaciones.objects.create(
    titulo="Test",
    descripcion="Test",
    imagen="/media/capacitaciones/imagenes/test.png",
    estado=0
)

# 2. Crear archivo físico
import os
from django.conf import settings
ruta = os.path.join(settings.MEDIA_ROOT, 'capacitaciones/imagenes/test.png')
with open(ruta, 'wb') as f:
    f.write(b'test image data')

# 3. Cambiar fecha de creación a más de 24 horas atrás
import subprocess
subprocess.run(['touch', '-t', '202501010000', ruta])

# 4. Eliminar capacitación
cap.delete()

# 5. Ejecutar limpieza
from capacitaciones.tasks import limpiar_directorio_certificados
resultado = limpiar_directorio_certificados()

# 6. Verificar que se eliminó
assert 'test.png' not in os.listdir(os.path.dirname(ruta))
assert resultado['detalles']['capacitaciones']['eliminados'] >= 1
```

### Caso 2: Lección Eliminada

```python
from capacitaciones.models import Lecciones, Modulos, Capacitaciones

# 1. Crear capacitación y módulo
cap = Capacitaciones.objects.create(...)
mod = Modulos.objects.create(idcapacitacion=cap, nombremodulo="Test")

# 2. Crear lección con PDF
lec = Lecciones.objects.create(
    idmodulo=mod,
    tituloleccion="Test",
    tipoleccion="pdf",
    url="/media/capacitaciones/pdfs/test.pdf"
)

# 3. Crear archivo
ruta = os.path.join(settings.MEDIA_ROOT, 'capacitaciones/pdfs/test.pdf')
with open(ruta, 'wb') as f:
    f.write(b'PDF content')
subprocess.run(['touch', '-t', '202501010000', ruta])

# 4. Eliminar lección
lec.delete()

# 5. Ejecutar limpieza
resultado = limpiar_directorio_certificados()

# 6. Verificar
assert resultado['detalles']['lecciones']['eliminados'] >= 1
```

### Caso 3: No Elimina Archivos Recientes

```python
# Crear archivo de hace 10 horas (menos que 24)
ruta = os.path.join(settings.MEDIA_ROOT, 'capacitaciones/imagenes/test_reciente.png')
with open(ruta, 'wb') as f:
    f.write(b'test')

# Cambiar fecha a 10 horas atrás
fecha_10_horas = datetime.now() - timedelta(hours=10)
timestamp = fecha_10_horas.timestamp()
os.utime(ruta, (timestamp, timestamp))

# Ejecutar limpieza
resultado = limpiar_directorio_certificados()

# Verificar que NO se eliminó (demasiado reciente)
assert os.path.exists(ruta), "Archivo reciente no debería eliminarse"
```

### Caso 4: No Elimina Archivos Referenciados

```python
# 1. Crear capacitación con imagen
cap = Capacitaciones.objects.create(
    imagen="/media/capacitaciones/imagenes/valido.png",
    ...
)

# 2. Crear archivo
ruta = os.path.join(settings.MEDIA_ROOT, 'capacitaciones/imagenes/valido.png')
with open(ruta, 'wb') as f:
    f.write(b'test')
subprocess.run(['touch', '-t', '202501010000', ruta])

# 3. Ejecutar limpieza
resultado = limpiar_directorio_certificados()

# 4. Verificar que NO se eliminó (está en BD)
assert os.path.exists(ruta), "Archivo válido no debería eliminarse"
assert resultado['detalles']['capacitaciones']['eliminados'] == 0
```

### Caso 5: Ignora URLs de Cloudinary

```python
# URLs de Cloudinary no se tocan
cap = Capacitaciones.objects.create(
    imagen="https://res.cloudinary.com/cloud/image/upload/v123/test.png",
    ...
)

# Ejecutar limpieza
resultado = limpiar_directorio_certificados()

# Cloudinary URLs no se procesan localmente
assert 'cloudinary' not in str(resultado)
```

---

## Logs Esperados

```
🧹 Iniciando limpieza de archivos huérfanos de capacitaciones y certificados...
📋 Limpiando certificados huérfanos...
✓ Certificado huérfano eliminado: /ruta/media/certificados_generados/2024/01/test.pdf
🎓 Limpiando archivos de capacitaciones...
✓ Archivo huérfano (imagen_capacitacion) eliminado: /ruta/media/capacitaciones/imagenes/test.png
✓ Archivo huérfano (leccion) eliminado: /ruta/media/capacitaciones/pdfs/test.pdf
✓ Archivo huérfano (pregunta) eliminado: /ruta/media/capacitaciones/preguntas/img.png
✓ Archivo huérfano (respuesta) eliminado: /ruta/media/capacitaciones/respuestas/img.png

✅ Limpieza completada:
📋 Certificados: 1 eliminados, 0 errores
🎓 Capacitaciones: 1 eliminados, 0 errores
📚 Lecciones: 1 eliminados, 0 errores
❓ Preguntas: 1 eliminados, 0 errores
✅ Respuestas: 1 eliminados, 0 errores

Total: 5 archivos eliminados, 0 errores
```

---

## Configuración en Celerybeat

Añadir a `core/celery.py` o `settings.py`:

```python
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    # ... tareas existentes ...
    
    'limpiar-archivos-huerfanos': {
        'task': 'capacitaciones.tasks.limpiar_directorio_certificados',
        'schedule': crontab(hour=2, minute=0),  # Ejecutar a las 2 AM diariamente
    },
}
```

---

## Troubleshooting

### Error: "Directorio no existe"
- Es normal si no hay archivos de capacitaciones aún
- La tarea ignora directorios que no existen

### Error: "Permission denied"
- Verificar permisos en `/media/`
- Asegurar que el usuario de Django tiene permisos de escritura

### Error: "File in use"
- En Windows, archivos abiertos no pueden eliminarse
- Cerrar cualquier archivo que esté siendo usado

### No elimina archivos esperados
- Verificar que sea más antiguo de 24 horas
- Verificar que no esté en BD
- Revisar logs para más detalles

---

## Performance

- **N capacitaciones:** O(N) queries
- **N lecciones:** O(N) queries
- **Recorrido del disco:** O(files) - lineal

**Para 10K capacitaciones:** ~5-10 segundos

**Optimización futura:** Batch queries con `values_list()` en lugar de objetos completos

