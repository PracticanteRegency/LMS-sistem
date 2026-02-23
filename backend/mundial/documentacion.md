# Documentación del Sistema Mundial 2026

## Resumen del Sistema

Sistema completo de predicción para el Mundial 2026 con soporte para múltiples ediciones (adaptable a futuros mundiales). El sistema incluye **8 dominios principales**: Ediciones, Equipos, Partidos, Predicciones, Ranking, Predicciones Especiales, Configuración y Estadísticas.

**Características principales:**
- Multi-edición: Maneja múltiples mundiales simultáneamente
- Auto-bloqueo: Cierra predicciones 1h antes del partido
- Penaltis: Sistema de predicción y puntuación para desempates
- Ranking adaptativo: Top 10 con desempate por primera predicción
- Imágenes de equipos: Almacenamiento en `media/banderas/` con reemplazo automático
- Configuración bloqueada: Se bloquea 1h antes del primer partido

---

## 1. Información General del API

**Base URL:** `/mundial/`

**Autenticación:** JWT Bearer token (header `Authorization: Bearer <token>`)

**Formato de datos:** JSON

**Servidor:** Django REST Framework

---

## 2. Endpoints API REST

### 2.1 Ediciones del Mundial

#### `GET /mundial/ediciones/`
Lista todas las ediciones del torneo.

**Response 200:**
```json
[
  {
    "id": 1,
    "nombre": "USA/MX/CA 2026",
    "anio": 2026,
    "activa": true,
    "bloqueo_configuracion": false,
    "primer_partido_fecha": "2026-06-11 18:00",
    "esta_iniciado": false,
    "creado_en": "2026-01-01T00:00:00Z"
  }
]
```

#### `POST /mundial/ediciones/` (Solo Admin)
Crea una nueva edición del mundial.

**Request body:**
```json
{
  "nombre": "Canada 2030",
  "anio": 2030,
  "activa": false
}
```

#### `GET /mundial/ediciones/<id>/`
Obtiene detalles de una edición.

#### `PUT /mundial/ediciones/<id>/` (Solo Admin)
Actualiza una edición.

---

### 2.2 Equipos

#### `GET /mundial/equipos/`
Lista todos los equipos activos (48 selecciones).

**Response 200:**
```json
[
  {
    "id": 1,
    "nombre": "México",
    "bandera": "https://host/media/banderas/mexico.png",  // O emoji: "🇲🇽"
    "bandera_emoji": "🇲🇽",
    "activo": true
  }
]
```

#### `POST /mundial/equipos/` (Solo Admin)
Crea un nuevo equipo con imagen.

**Request (multipart/form-data):**
```
nombre: "México"
bandera_imagen: <archivo PNG/SVG>
bandera_emoji: "🇲🇽"
activo: true
```

**Nota:** La imagen se almacena en `media/banderas/`. Si se actualiza, la anterior se elimina automáticamente.

#### `GET /mundial/equipos/<id>/`
Obtiene detalles de un equipo.

#### `PUT /mundial/equipos/<id>/` (Solo Admin)
Actualiza un equipo (puede cambiar imagen).

#### `DELETE /mundial/equipos/<id>/` (Solo Admin)
Desactiva un equipo (soft delete).

---

### 2.3 Partidos

#### `GET /mundial/partidos/`
Lista todos los partidos con predicción del usuario embebida.

**Query params:**
```
fase=Grupos        // Filtrar por fase
grupo=A            // Filtrar por grupo
estado=abierto     // Filtrar por estado
search=México      // Buscar equipo
```

**Response 200:**
```json
{
  "partidos": [
    {
      "id": 1,
      "edicion": 1,
      "equipo_local": 1,
      "equipo_local_nombre": "México",
      "equipo_local_bandera": "🇲🇽",
      "equipo_visitante": 2,
      "equipo_visitante_nombre": "Uruguay",
      "equipo_visitante_bandera": "🇺🇾",
      "fecha": "2026-06-11",
      "hora": "18:00",
      "fase": "Grupos",
      "grupo": "A",
      "multiplicador": "x1",
      "estado": "abierto",
      "resultado": null,
      "fue_a_penaltis": false,
      "puede_predecir": true,
      "mi_prediccion": {
        "id": 5,
        "goles_local": 2,
        "goles_visitante": 1,
        "ganador": "local",
        "predice_penaltis": false,
        "puntos_obtenidos": 3,
        "puntos_penaltis": 0,
        "es_acierto_exacto": false,
        "puntos_totales": 3
      }
    }
  ],
  "total": 62,
  "equipos": [...],
  "estadisticas": {
    "total_partidos": 62,
    "partidos_predichos": 15,
    "partidos_pendientes": 47
  }
}
```

#### `POST /mundial/partidos/` (Solo Admin)
Crea un nuevo partido.

**Request body:**
```json
{
  "edicion": 1,
  "equipo_local": 1,
  "equipo_visitante": 2,
  "fecha": "2026-06-11",
  "hora": "18:00",
  "fase": "Grupos",
  "grupo": "A",
  "estado": "abierto"
}
```

**Nota:** El `multiplicador` se asigna automáticamente según la fase.

#### `GET /mundial/admin/partidos/`
Vista administrativa (sin predicciones propias del admin).

```json
{
  "partidos": [
    {
      "...": "...",
      "total_predicciones": 45,
      "puede_editar": true,
      "puede_ingresar_resultado": false,
      "goles_local": null,
      "goles_visitante": null,
      "penaltis_local": null,
      "penaltis_visitante": null
    }
  ],
  "total": 62
}
```

#### `GET /mundial/partidos/<id>/`
Obtiene detalles de un partido.

#### `PUT /mundial/partidos/<id>/` (Solo Admin)
Actualiza un partido (solo si `estado=abierto`).

#### `DELETE /mundial/partidos/<id>/` (Solo Admin)
Elimina un partido y sus predicciones (solo si `estado=abierto`).

#### `POST /mundial/partidos/<id>/resultado/` (Solo Admin)
Registra el resultado final. Solo permitido si `estado=bloqueado`.

**Request body:**
```json
{
  "goles_local": 2,
  "goles_visitante": 1,
  "fue_a_penaltis": false,
  "penaltis_local": null,
  "penaltis_visitante": null
}
```

**Validación:** Si `fue_a_penaltis=true`, ambos goles deben ser iguales (empate) y se requieren los marcadores de penaltis.

**Response 200:**
```json
{
  "partido": {...},
  "puntos_calculados": true,
  "resumen": {
    "exactos": 8,
    "ganadores": 45,
    "penaltis_exactos": 2,
    "penaltis_ganadores": 5,
    "fallos": 89,
    "total_evaluadas": 149
  }
}
```

**Logica del backend:**
1. Actualiza `estado=finalizado`
2. Guarda resultado (goles y penaltis si aplica)
3. Para cada predicción:
   - Calcula puntos según configuración
   - Multiplica por el multiplicador de la fase
   - Actualiza puntos de penaltis si aplica
4. Actualiza ranking del usuario
5. Recalcula posiciones (mayor puntaje primero, desempate por primera predicción)

---

### 2.4 Predicciones

#### `GET /mundial/predicciones/`
Obtiene todas las predicciones del usuario autenticado.

**Response 200:**
```json
{
  "predicciones": [
    {
      "id": 5,
      "partido": 1,
      "nombre_partido": "México vs Uruguay - 2026-06-11",
      "goles_local": 2,
      "goles_visitante": 1,
      "ganador": "local",
      "predice_penaltis": false,
      "penaltis_local": null,
      "penaltis_visitante": null,
      "ganador_penaltis": null,
      "puntos_obtenidos": 3,
      "puntos_penaltis": 0,
      "puntos_totales": 3,
      "es_acierto_exacto": false,
      "creado_en": "2026-06-10T14:30:00Z",
      "actualizado_en": "2026-06-10T14:30:00Z"
    }
  ],
  "total": 15
}
```

#### `POST /mundial/predicciones/`
Crea o actualiza la predicción de un partido (upsert).

**Request body:**
```json
{
  "partido": 1,
  "goles_local": 2,
  "goles_visitante": 1,
  "ganador": "local",
  "predice_penaltis": false,
  "penaltis_local": null,
  "penaltis_visitante": null,
  "ganador_penaltis": null
}
```

**Validaciones:**
- El partido debe existir y estar en estado `abierto`
- Faltan más de 1h para el inicio del partido
- El `ganador` debe ser coherente con el marcador:
  - `goles_local > goles_visitante` → `ganador = "local"`
  - `goles_visitante > goles_local` → `ganador = "visitante"`
  - `goles_local == goles_visitante` → `ganador = "empate"`
- Si `predice_penaltis=true`:
  - El `ganador` debe ser `"empate"`
  - Se requieren `penaltis_local` y `penaltis_visitante`
  - No pueden ser iguales
  - Se requiere `ganador_penaltis`

**Response 201/200:**
```json
{
  "id": 5,
  "partido": 1,
  "nombre_partido": "México vs Uruguay - 2026-06-11",
  "goles_local": 2,
  "goles_visitante": 1,
  "ganador": "local",
  "predice_penaltis": false,
  "puntos_obtenidos": null,
  "puntos_penaltis": null,
  "puntos_totales": null,
  "es_acierto_exacto": false,
  "creado_en": "2026-06-10T14:30:00Z",
  "actualizado_en": "2026-06-10T14:30:00Z"
}
```

---

### 2.5 Predicciones Especiales

#### `GET /mundial/predicciones-especiales/`
Obtiene todas las predicciones especiales del usuario.

**Response 200:**
```json
{
  "predicciones": [
    {
      "id": 1,
      "tipo": "campeon",
      "tipo_display": "Campeón",
      "equipo_seleccionado": 3,
      "equipo_nombre": "Argentina",
      "jugador_seleccionado": null,
      "puntos_obtenidos": null,
      "puede_editar": true,
      "fecha_cierre": "2026-06-11T17:00:00Z",
      "creado_en": "2026-01-15T10:30:00Z",
      "actualizado_en": "2026-01-15T10:30:00Z"
    }
  ]
}
```

#### `POST /mundial/predicciones-especiales/`
Crea o actualiza una predicción especial.

**Request body:**
```json
{
  "tipo": "campeon",
  "equipo_seleccionado": 3,
  "jugador_seleccionado": null
}
```

**Validaciones:**
- Solo se puede guardar si la configuración especial está abierta (`fecha_cierre` no ha pasado)
- Para tipos de equipo (campeón, subcampeón, tercer lugar): se requiere `equipo_seleccionado`
- Para máximo goleador: se requiere `jugador_seleccionado`

**Response 201/200:** Mismo formato que GET.

---

### 2.6 Ranking

#### `GET /mundial/ranking/`
Obtiene el ranking con top 10 y posición del usuario.

**Query params:**
```
limite=10  // Top N (default: 10)
```

**Response 200:**
```json
{
  "ranking": [
    {
      "posicion": 1,
      "nombre": "Carlos Rodriguez",
      "iniciales": "CR",
      "email": "carlos@email.com",
      "puntos_totales": 156,
      "puntos_partidos": 140,
      "puntos_especiales": 16,
      "aciertos_exactos": 12,
      "predicciones_especiales_acertadas": 2,
      "tendencia": 5,
      "tendencia_str": "+5"
    }
  ],
  "total_participantes": 256,
  "mi_posicion": {
    "posicion": 15,
    "nombre": "Juan Pérez",
    "iniciales": "JP",
    "email": "juan@email.com",
    "puntos_totales": 98,
    "puntos_partidos": 85,
    "puntos_especiales": 13,
    "aciertos_exactos": 5,
    "predicciones_especiales_acertadas": 1,
    "tendencia": -2,
    "tendencia_str": "-2"
  }
}
```

**Criterios de ordenamiento:**
1. Mayor `puntos_totales` primero
2. Mayor `aciertos_exactos` en desempate
3. `fecha_primera_prediccion` más antigua en caso de igualdad (desempate)

---

### 2.7 Configuración del Torneo

#### `GET /mundial/configuracion/`
Obtiene la configuración actual del torneo (visible para todos).

**Response 200:**
```json
{
  "id": 1,
  "edicion": 1,
  "puntos_resultado_exacto": 3,
  "puntos_ganador_correcto": 1,
  "multiplicador_grupos": "x1",
  "multiplicador_dieciseisavos": "x1.25",
  "multiplicador_octavos": "x1.5",
  "multiplicador_cuartos": "x1.75",
  "multiplicador_semifinales": "x2",
  "multiplicador_tercer_puesto": "x2.5",
  "multiplicador_final": "x3",
  "multiplicadores": {
    "Grupos": "x1",
    "16avos": "x1.25",
    "Octavos": "x1.5",
    "Cuartos": "x1.75",
    "Semifinales": "x2",
    "Tercer Puesto": "x2.5",
    "Final": "x3"
  },
  "puntos_campeon": 50,
  "puntos_subcampeon": 30,
  "puntos_tercer_lugar": 20,
  "puntos_maximo_goleador": 25,
  "porcentaje_primer_lugar": "50%",
  "porcentaje_segundo_lugar": "30%",
  "porcentaje_tercer_lugar": "20%",
  "fondo_premios_total": "$50,000",
  "puede_editarse": true,
  "actualizado_en": "2026-01-15T10:30:00Z"
}
```

#### `PUT /mundial/configuracion/` (Solo Admin)
Actualiza la configuración (bloqueada cuando inicia el torneo - 1h antes del primer partido).

**Request body:** (campos parciales)
```json
{
  "puntos_resultado_exacto": 3,
  "puntos_ganador_correcto": 1,
  "multiplicador_grupos": "x1",
  "multiplicador_final": "x5",
  "fondo_premios_total": "$100,000"
}
```

**Validación:** Si `edicion.bloqueo_configuracion=true`, retorna 403.

---

### 2.8 Configuración Predicciones Especiales

#### `GET /mundial/configuracion-especiales/`
Lista las predicciones especiales habilitadas (visible para todos).

**Response 200:**
```json
[
  {
    "id": 1,
    "edicion": 1,
    "tipo": "campeon",
    "tipo_display": "Campeón",
    "habilitada": true,
    "fecha_cierre": "2026-06-11T17:00:00Z",
    "descripcion": "¿Cuál será el campeón del mundial?",
    "estado": "abierta",
    "puntos_acierto": 50,
    "esta_abierta": true
  }
]
```

#### `POST /mundial/configuracion-especiales/` (Solo Admin)
Crea una nueva configuración especial.

**Request body:**
```json
{
  "edicion": 1,
  "tipo": "campeon",
  "fecha_cierre": "2026-06-11T17:00:00Z",
  "descripcion": "¿Cuál será el campeón del mundial?",
  "puntos_acierto": 50
}
```

#### `PUT /mundial/configuracion-especiales/<id>/` (Solo Admin)
Actualiza una configuración especial (bloqueada cuando inicia el torneo).

---

### 2.9 Estadísticas

#### `GET /mundial/estadisticas/`
Obtiene estadísticas generales para la homepage (requiere autenticación).

**Response 200:**
```json
{
  "total_participantes": 256,
  "total_partidos": 62,
  "partidos_jugados": 6,
  "partidos_pendientes": 56,
  "total_equipos": 48,
  "total_predicciones": 8432,
  "partidos_predichos_usuario": 15,
  "fondo_premios": "$50,000"
}
```

---

## 3. Relación Pagina/Componente ↔ Endpoints

| Componente | Endpoints |
|------------|-----------|
| **Header** | `GET /mundial/configuracion/` (para mostrar fondo de premios) |
| **Homepage** | `GET /mundial/estadisticas/`, `GET /mundial/ranking/?limite=8`, `GET /mundial/partidos/?estado=abierto&limite=6`, `GET /mundial/configuracion/` |
| **Lista Partidos** | `GET /mundial/partidos/`, `GET /mundial/predicciones/` |
| **Crear Predicción** | `POST /mundial/predicciones/` |
| **Predicciones Especiales** | `GET /mundial/predicciones-especiales/`, `POST /mundial/predicciones-especiales/`, `GET /mundial/configuracion-especiales/` |
| **Ranking** | `GET /mundial/ranking/?limite=N` |
| **Admin > Partidos** | `GET /mundial/admin/partidos/`, `POST /mundial/partidos/`, `PUT /mundial/partidos/<id>/`, `DELETE /mundial/partidos/<id>/` |
| **Admin > Resultados** | `GET /mundial/admin/partidos/`, `POST /mundial/partidos/<id>/resultado/` |
| **Admin > Configuración** | `GET /mundial/configuracion/`, `PUT /mundial/configuracion/`, `GET /mundial/configuracion-especiales/`, `POST /mundial/configuracion-especiales/`, `PUT /mundial/configuracion-especiales/<id>/` |
| **Admin > Equipos** | `GET /mundial/equipos/`, `POST /mundial/equipos/`, `PUT /mundial/equipos/<id>/`, `DELETE /mundial/equipos/<id>/` |

---

## 4. Autenticación y Autorización

**Todos los endpoints requieren autenticación via JWT token:**
```
Authorization: Bearer <jwt_token>
```

**Control de acceso:**
- Endpoints sin restricción: `GET /mundial/equipos/`, `GET /mundial/configuracion/`, `GET /mundial/configuracion-especiales/`
- Solo autenticado: Todos los GET de datos del usuario (mis predicciones, ranking, estadísticas)
- Solo admin (`tipousuario` in [1, 4]): POST/PUT/DELETE de equipos, partidos, resultados, configuración

---

## 5. Sistema de Puntuación Detallado

### Cálculo básico (tiempo reglamentario):
```
1. Si predicción exacta (goles_local y goles_visitante coinciden):
   → puntos_base = config.puntos_resultado_exacto (3)
   → es_acierto_exacto = true

2. Si solo ganador correcto (empate, local o visitante):
   → puntos_base = config.puntos_ganador_correcto (1)

3. Aplicar multiplicador según fase:
   → puntos_obtenidos = puntos_base × multiplicador_fase
```

### Cálculo de penaltis (adicional):
```
4. Si el partido fue a penaltis Y el usuario predijo penaltis:
   
   a. Si penaltis exactos:
      → puntos_pen_base = config.puntos_resultado_exacto (3)
   
   b. Si solo ganador correcto en penaltis:
      → puntos_pen_base = config.puntos_ganador_correcto (1)
   
   → puntos_penaltis = puntos_pen_base × multiplicador_fase

5. puntos_totales = puntos_obtenidos + puntos_penaltis
```

### Ejemplo completo:
```
Partido: México vs Uruguay (Grupos - multiplicador x1)
Predicción del usuario: 2-1 México (sin penaltis)
Resultado real: 2-1 México

→ es_acierto_exacto = true
→ puntos_base = 3 (exacto)
→ puntos_obtenidos = 3 × 1 = 3 puntos
→ ranking.aciertos_exactos += 1
→ ranking.puntos_partidos += 3
```

### Penaltis en Cuartos:
```
Predicción: 1-1 + Penaltis 4-3 Francia (multiplicador x1.75)
Resultado real: 1-1 + Penaltis 4-3 Francia

→ puntos_obtenidos = 3 × 1.75 = 5.25 → 5 pts
→ puntos_penaltis = 3 × 1.75 = 5.25 → 5 pts
→ puntos_totales = 10 puntos
```

---

## 6. Sistema de Ranking

**Recalculo automático** cuando se registra un resultado:

```
1. Obtener todas las predicciones del partido evaluado
2. Para cada predicción:
   → Calcular puntos (incluye penaltis)
   → Actualizar RankingMundial del usuario:
     - puntos_partidos += puntos_obtenidos + puntos_penaltis
     - aciertos_exactos += 1 (si aplica)
     - puntos_totales = puntos_partidos + puntos_especiales

3. Ordenar por:
   a) puntos_totales DESC
   b) aciertos_exactos DESC
   c) fecha_primera_prediccion ASC (desempate: quién predijo primero)

4. Asignar posiciones 1, 2, 3, ... N
5. Calcular tendencia = posicion_anterior - posicion_nueva
```

---

## 7. Auto-bloqueos del Sistema

### Bloqueo de predicciones:
```
Cuando faltan ≤ 1 hora para el inicio:
- partido.estado cambia de "abierto" → "bloqueado"
- NO se aceptan nuevas predicciones
- Se ejecuta automáticamente en cada GET /mundial/partidos/
```

### Bloqueo de configuración:
```
Cuando faltan ≤ 1 hora para el primer partido:
- edicion.bloqueo_configuracion = true
- NO se puede editar ConfiguracionTorneo
- NO se puede editar ConfiguracionPrediccionEspecial
- Solo lectura
```

---

## 8. Soporte para Múltiples Ediciones

El sistema está diseñado para adaptarse a futuros mundiales:

**Estructura:**
- `EdicionMundial` almacena año, nombre, estado (activa/inactiva)
- Solo 1 edición puede estar `activa=true` a la vez
- `Partido`, `Prediccion`, `RankingMundial` relacionados a `EdicionMundial` vía FK
- `ConfiguracionTorneo` conectada a `EdicionMundial` via OneToOneField

**Escalabilidad:**
- Crear nuevo `EdicionMundial` para 2030
- Importar/copiar `Equipo` del 2026
- Configurar nuevos `ConfiguracionTorneo` y `ConfiguracionPrediccionEspecial`
- Activar edición y el sistema funciona igual
- Datos del 2026 quedan intactos bajo edición anterior

---

## 9. Estructura de Respuestas de Error

**Formato estándar para 400+:**
```json
{
  "error": "CODIGO_ERROR",
  "message": "Descripción legible del error",
  "details": { "campo": ["error específico"] }  // Si aplica
}
```

**Códigos de error comunes:**
- `MATCH_LOCKED` → Partido cerrado (no se aceptan predicciones)
- `MATCH_NOT_FOUND` → Partido no existe
- `MATCH_ALREADY_FINISHED` → Partido ya finalizó
- `INVALID_PREDICTION` → Predicción no válida (ganador ≠ marcador)
- `CONFIGURATION_LOCKED` → Configuración bloqueada (torneo iniciado)
- `UNAUTHORIZED_ADMIN` → Permisos insuficientes
- `INVALID_IMAGE_FORMAT` → Formato de imagen no soportado

---

## 10. Headers Requeridos

```
Authorization: Bearer <jwt_token>      [requerido en todas]
Content-Type: application/json         [excepto multipart en equipos]
Accept: application/json               [recomendado]
```

---

## 11. Códigos HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK (GET, PUT exitoso) |
| 201 | Creado (POST exitoso) |
| 204 | Sin contenido (DELETE exitoso) |
| 400 | Validación fallida |
| 401 | No autenticado |
| 403 | No autorizado (permiso insuficiente) |
| 404 | No encontrado |
| 409 | Conflicto (ej: equipos duplicados) |
| 500 | Error interno |
