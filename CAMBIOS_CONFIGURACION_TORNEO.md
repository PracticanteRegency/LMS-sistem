# Resumen de Cambios - Configuración del Torneo en una Sola Tabla

**Fecha:** 26 de Febrero de 2026  
**Objetivo:** Consolidar TODA la configuración del torneo (fases, premios, puntos, reglas) en una única tabla `ConfiguracionTorneo` con CRUD completo (GET, POST, PUT, DELETE) editable solo por admin.

---

## 1. Cambios en el Modelo (models.py)

### ✅ Ampliación de ConfiguracionTorneo

Se agregaron **11 nuevos campos** a la tabla para mayor flexibilidad:

```python
# Información general del torneo
nombre_torneo = CharField(max_length=200, default="Copa Mundial 2026")
descripcion = TextField(blank=True)
pais_sede = CharField(max_length=100, blank=True)
fecha_inicio = DateField(null=True, blank=True)
fecha_fin = DateField(null=True, blank=True)

# Puntuación mejorada
puntos_bonus_acierto_exacto = IntegerField(default=1)

# Configuración de reglas
habilitar_predicciones_especiales = BooleanField(default=True)
habilitar_penaltis = BooleanField(default=True)
minutos_antes_bloqueo = IntegerField(default=60)
maxima_diferencia_goles = IntegerField(default=10)

# Estado
activa = BooleanField(default=True)
```

### ✅ Cambio de Ruta de Imágenes (Equipo)

```python
# ANTES:
bandera_imagen = models.ImageField(upload_to="banderas/", null=True, blank=True)

# DESPUÉS:
bandera_imagen = models.ImageField(upload_to="mundial/banderas/", null=True, blank=True)
```

Las imágenes ahora se almacenan en: `media/mundial/banderas/` (subdirectorio específico del app)

---

## 2. Cambios en las Vistas (views.py)

### ✅ ConfiguracionTorneoView - Métodos CRUD Completos

```python
class ConfiguracionTorneoView(APIView):
    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "POST", "DELETE"]:
            return [IsAuthenticated(), IsSuperUserOrAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        """GET - Visible para todos"""
        # Retorna la configuración de la edición activa

    def post(self, request):
        """POST - Solo admin. Crea nueva configuración."""
        # Valida que no exista otra para la misma edición
        # Retorna 201 Created

    def put(self, request):
        """PUT - Solo admin. Edita configuración."""
        # Validación: Falla si edicion.bloqueo_configuracion=true
        # Retorna 200 OK

    def delete(self, request):
        """DELETE - Solo admin. Elimina configuración."""
        # Validación: Falla si edicion.bloqueo_configuracion=true
        # Retorna 204 No Content
```

**Cambios claves:**
- ✅ Agregado método `POST` para crear configuración
- ✅ Agregado método `DELETE` para eliminar configuración
- ✅ Ambos métodos requieren permisos de admin
- ✅ Ambos respetan el bloqueo automático (1h antes del primer partido)

---

## 3. Cambios en los Serializers (serializers.py)

### ✅ ConfiguracionTorneoSerializer - Nuevos Campos

```python
class ConfiguracionTorneoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionTorneo
        fields = [
            "id", "edicion",
            # Información general ↓
            "nombre_torneo", "descripcion", "pais_sede", "fecha_inicio", "fecha_fin",
            # Puntuación ↓
            "puntos_resultado_exacto", "puntos_ganador_correcto", "puntos_bonus_acierto_exacto",
            # Multiplicadores ↓
            "multiplicador_grupos", "multiplicador_dieciseisavos", "multiplicador_octavos",
            "multiplicador_cuartos", "multiplicador_semifinales", "multiplicador_tercer_puesto",
            "multiplicador_final", "multiplicadores",
            # Predicciones especiales ↓
            "puntos_campeon", "puntos_subcampeon", "puntos_tercer_lugar", "puntos_maximo_goleador",
            # Premios ↓
            "porcentaje_primer_lugar", "porcentaje_segundo_lugar", "porcentaje_tercer_lugar",
            "fondo_premios_total",
            # Configuración de reglas ↓
            "habilitar_predicciones_especiales", "habilitar_penaltis", "minutos_antes_bloqueo",
            "maxima_diferencia_goles",
            # Estado ↓
            "activa", "puede_editarse", "actualizado_en",
        ]
        read_only_fields = ["actualizado_en", "puede_editarse"]
```

**Total de campos expuestos:** 35 campos

---

## 4. URLs (ya existentes)

✅ Mantiene estructura existente:

```python
path("configuracion/", views.ConfiguracionTorneoView.as_view(), name="configuracion-torneo")
```

**Soporta automáticamente:**
- `GET /mundial/configuracion/` → Obtener
- `POST /mundial/configuracion/` → Crear
- `PUT /mundial/configuracion/` → Actualizar
- `DELETE /mundial/configuracion/` → Eliminar

---

## 5. Migraciones Creadas

### 📄 0002_add_configuracion_fields.py
Agrega los 11 nuevos campos a `ConfiguracionTorneo`

### 📄 0003_update_equipo_bandera_path.py
Cambia `upload_to` de `banderas/` a `mundial/banderas/`

---

## 6. Documentación

### 📄 documentacion.md (Actualizada)
- Sección 2.7 expandida con todos los nuevos campos
- Ejemplos JSON actualizados
- Validaciones documentadas

### 📄 TABLA_CONFIGURACION_TORNEO.md (Nuevo)
Referencia completa de la tabla con:
- Matriz de todos los campos
- Métodos principales
- Flujo de bloqueo
- Ejemplos de uso
- SQL schema

---

## 7. Funcionalidad Implementada

### ✅ Una Única Tabla para TODO

| Aspecto | Contenido | Editable |
|---------|-----------|----------|
| **Información General** | Nombre, descripción, país, fechas | Admin only |
| **Fases** | Multiplicadores x1 a x3 para 7 fases | Admin only |
| **Puntuación** | Puntos exacto, ganador, bonus | Admin only |
| **Predicciones Especiales** | Puntos campeón, subcampeón, 3er lugar, máx goleador | Admin only |
| **Premios** | Porcentajes y monto total | Admin only |
| **Reglas** | Habilitar/deshabilitar funciones, minutos de bloqueo | Admin only |

### ✅ Control de Acceso

| Operación | Usuario | Admin | Bloqueada |
|-----------|---------|-------|-----------|
| **GET** | ✓ | ✓ | No |
| **POST** | ✗ | ✓ | No |
| **PUT** | ✗ | ✓ (si no bloqueada) | ✓ |
| **DELETE** | ✗ | ✓ (si no bloqueada) | ✓ |

### ✅ Auto-Bloqueo

La configuración se bloquea automáticamente cuando:
- La edición entra en estado "iniciado" (1 hora antes del primer partido)
- Entonces `edicion.bloqueo_configuracion = true`
- Y `puede_editarse()` retorna `false`
- PUT y DELETE retornan 403 Forbidden

---

## 8. Endpoints Disponibles

### GET /mundial/configuracion/ (Público)
```
Método: GET
Autenticación: IsAuthenticated
Permisos: Todos los usuarios
Descripción: Obtiene la configuración actual
Respuesta: 200 JSON con 35 campos
```

### POST /mundial/configuracion/ (Admin)
```
Método: POST
Autenticación: IsAuthenticated + IsSuperUserOrAdmin
Descripción: Crea configuración para una edición
Body: JSON con campos (edicion requerido)
Respuesta: 201 Created + config guardada
Validación: No duplicados por edición
```

### PUT /mundial/configuracion/ (Admin)
```
Método: PUT
Autenticación: IsAuthenticated + IsSuperUserOrAdmin
Descripción: Edita la configuración de la edición activa
Body: JSON parcial (todos los campos opcionales)
Respuesta: 200 OK si puede editarse, 403 si está bloqueada
```

### DELETE /mundial/configuracion/ (Admin)
```
Método: DELETE
Autenticación: IsAuthenticated + IsSuperUserOrAdmin
Descripción: Elimina la configuración de la edición activa
Respuesta: 204 No Content si puede eliminarse, 403 si está bloqueada
```

---

## 9. Ejemplo de Flujo Completo

```bash
# 1. Admin crea edición
POST /mundial/ediciones/
Content-Type: application/json
{
  "nombre": "USA/MX/CA 2026",
  "anio": 2026,
  "activa": true
}
# Respuesta: 201 → id: 1

# 2. Admin crea configuración
POST /mundial/configuracion/
Authorization: Bearer <token_admin>
Content-Type: application/json
{
  "edicion": 1,
  "nombre_torneo": "Copa Mundial 2026",
  "puntos_resultado_exacto": 3,
  "puntos_ganador_correcto": 1,
  "multiplicador_final": "x3",
  "fondo_premios_total": "$50,000",
  "habilitar_penaltis": true,
  "minutos_antes_bloqueo": 60
}
# Respuesta: 201 Created

# 3. Usuario ve configuración
GET /mundial/configuracion/
Authorization: Bearer <token>
# Respuesta: 200 {
#   "id": 1,
#   "nombre_torneo": "Copa Mundial 2026",
#   "puede_editarse": true,
#   ...
# }

# 4. Admin edita antes de bloqueo
PUT /mundial/configuracion/
Authorization: Bearer <token_admin>
{
  "fondo_premios_total": "$100,000"
}
# Respuesta: 200 OK ✓

# 5. (Pasa tiempo, se alcanza 1h antes del primer partido)
# Sistema auto-bloquea: edicion.bloqueo_configuracion = true

# 6. Admin intenta editar DESPUÉS de bloqueo
PUT /mundial/configuracion/
Authorization: Bearer <token_admin>
{
  "puntos_resultado_exacto": 5
}
# Respuesta: 403 Forbidden
# {"error": "La configuración está bloqueada porque el mundial ya ha iniciado."}
```

---

## 10. Testing

### ✅ Endpoints a Probar (Postman)

1. **GET /mundial/configuracion/** - Usuario normal
   - Debería ver toda la configuración
   - Campo `puede_editarse: true/false` según estado

2. **POST /mundial/configuracion/** - Admin
   - Con edición nueva → 201 Created
   - Con edición duplicada → 400 Bad Request

3. **PUT /mundial/configuracion/** - Admin
   - Antes de bloqueo → 200 OK
   - Después de bloqueo → 403 Forbidden

4. **DELETE /mundial/configuracion/** - Admin
   - Antes de bloqueo → 204 No Content
   - Después de bloqueo → 403 Forbidden

---

## 11. Archivos Modificados

```
✅ backend/mundial/models.py
   - Ampliado ConfiguracionTorneo (+11 campos)
   - Actualizado upload_to de Equipo.bandera_imagen

✅ backend/mundial/views.py
   - ConfiguracionTorneoView: Agregados POST y DELETE

✅ backend/mundial/serializers.py
   - ConfiguracionTorneoSerializer: +35 campos expuestos

✅ backend/mundial/documentacion.md
   - Sección 2.7 expandida

📄 backend/mundial/migrations/0002_add_configuracion_fields.py (Nuevo)
📄 backend/mundial/migrations/0003_update_equipo_bandera_path.py (Nuevo)
📄 backend/mundial/TABLA_CONFIGURACION_TORNEO.md (Nuevo)
```

---

## 12. Próximos Pasos

1. **Aplicar migraciones:**
   ```bash
   docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate mundial
   ```

2. **Probar en Postman/Frontend:**
   - Crear configuración nueva
   - Editar configuración
   - Verificar bloqueo automático
   - Probar DELETE

3. **Frontend (Opcional):**
   - Crear formulario admin para editar configuración
   - Mostrar campo `puede_editarse` para UI feedback
   - Deshabilitar inputs si está bloqueado

---

## 13. Resumen de Beneficios

✅ **Una sola tabla:** Toda la configuración centralizada en `ConfiguracionTorneo`

✅ **CRUD completo:** GET, POST, PUT, DELETE en un endpoint `/mundial/configuracion/`

✅ **Admin-editable:** Solo administrador puede modificar

✅ **Auto-bloqueado:** Se bloquea automáticamente 1h antes del primer partido

✅ **Flexible:** 35 campos configurables incluyendo nuevos items (premios, reglas)

✅ **Documentado:** Referencia completa y ejemplos de uso

✅ **Seguro:** Validación de permisos y estado en todos los métodos
