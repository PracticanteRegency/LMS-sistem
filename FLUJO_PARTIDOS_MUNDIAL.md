# 🏆 Flujo de Estados de Partidos del Mundial

## Estados y Transiciones Automáticas

```
ABIERTO ──[1 hora antes]──> BLOQUEADO ──[Admin registra resultado]──> FINALIZADO
   ↓                            ↓
   └────────────────────────────┘
     (Admin puede editar)
```

---

## 📋 Detalles del Flujo

### 1️⃣ **CREACIÓN DEL PARTIDO** → Estado: **ABIERTO**

**Cuándo**: Admin crea un partido desde **MundialAdmin**

**Qué pasa**:
- ✅ El partido se crea **SIEMPRE en estado ABIERTO** (forzado en el serializer)
- ✅ Los usuarios pueden hacer apuestas en MundialPartidos
- ✅ Admin puede editar los campos del partido (equipos, fecha, hora, fase, etc.)

**Código**: `PartidoCreateUpdateSerializer.create()` (serializers.py línea 183)
```python
def create(self, validated_data):
    # Forzar que los partidos nuevos se creen en estado ABIERTO
    validated_data["estado"] = EstadoPartido.ABIERTO
    ...
```

---

### 2️⃣ **CIERRE AUTOMÁTICO** → Estado: **BLOQUEADO**

**Cuándo**: Automáticamente **1 HORA ANTES** del partido

**Cómo funciona**:
- En cada request, se ejecuta `verificar_bloqueos_partidos(edicion)`
- Si un partido está ABIERTO y faltan menos de 1 hora: se cambia a BLOQUEADO
- Los usuarios **NO PUEDEN** hacer más apuestas
- Admin **NO PUEDE** editar el partido (excepto estado)

**Código**: `utils.py` línea 50-70
```python
def verificar_bloqueos_partidos(edicion=None):
    partidos = Partido.objects.filter(estado=EstadoPartido.ABIERTO, ...)
    for partido in partidos:
        if not partido.puede_predecir():  # Si faltan < 1 hora
            partido.estado = EstadoPartido.BLOQUEADO
            partido.save()
```

**Validación en serializer**: `PartidoCreateUpdateSerializer.validate()`
```python
def validate(self, data):
    if self.instance and not self.instance.puede_editar_admin():
        raise ValidationError("Solo partidos ABIERTOS pueden editarse")
    
    # Si está cerrado, no permitir cambiar equipos
    if self.instance and self.instance.estado != EstadoPartido.ABIERTO:
        if data.get("equipo_local") or data.get("equipo_visitante"):
            raise ValidationError("No se pueden cambiar equipos...")
```

---

### 3️⃣ **REGISTRO DE RESULTADO** → Estado: **FINALIZADO**

**Cuándo**: Admin registra el resultado en **MundialAdmin** → tab **Resultados**

**Qué debe hacer el Admin**:
1. Ir a **MundialAdmin** → tab **Resultados**
2. Seleccionar un partido en estado "⏳ Pendiente"
3. Ingresar:
   - **Goles Local** (número)
   - **Goles Visitante** (número)
   - *(Opcional) ¿Fue a penaltis?* → Si sí, ingresar goles de penaltis
4. Hacer clic en **Guardar**

**Qué pasa automáticamente**:
- ✅ El estado cambia a **FINALIZADO** automáticamente
- ✅ Se calcula si fue exacto, ganador, etc.
- ✅ Se reparten puntos a todos los usuarios que apostaron
- ✅ Se actualiza el ranking
- ✅ El partido aparece en el tab **Finalizados** con la banderita ✅

**Código**: `utils.py` línea 105-160
```python
def evaluar_resultado_partido(partido, goles_local, goles_visitante, ...):
    partido.goles_local = goles_local
    partido.goles_visitante = goles_visitante
    partido.fue_a_penaltis = fue_a_penaltis
    partido.estado = EstadoPartido.FINALIZADO  # ← Aquí se finaliza
    partido.save()
    
    # Calcular puntos para todas las predicciones
    # Actualizar ranking
```

---

## 🎯 Resumen de Permisos por Estado

| Estado | Usuario apuesta | Admin edita equipos | Admin registra resultado |
|--------|-----------------|-------------------|------------------------|
| **ABIERTO** | ✅ Sí | ✅ Sí | ❌ No |
| **BLOQUEADO** | ❌ No | ❌ No | ✅ Sí |
| **FINALIZADO** | ❌ No | ❌ No | ❌ No |

---

## 🔧 Métodos del Modelo `Partido`

```python
# Verificar si puede recibir apuestas (< 1 hora antes)
partido.puede_predecir()  → bool

# Verificar si admin puede editar (solo ABIERTO)
partido.puede_editar_admin()  → bool

# Verificar si admin puede ingresar resultado (solo BLOQUEADO)
partido.puede_ingresar_resultado()  → bool

# Bloquear automáticamente si es necesario
partido.verificar_y_bloquear()  → bool
```

---

## 📱 Flujo en la UI

### MundialPartidos (Usuario)
```
ABIERTO → Muestra [Predecir] botón
BLOQUEADO → Muestra [Bloqueado] button (deshabilitado)
FINALIZADO → Muestra resultado final
```

### MundialAdmin (Admin)

**Tab Partidos**:
- Muestra todos los partidos en ABIERTO y BLOQUEADO
- Botón ✏️ (Editar) solo funciona si está ABIERTO

**Tab Resultados**:
- **Pendientes**: Partidos en BLOQUEADO (sin resultado)
- **Finalizados**: Partidos en FINALIZADO (con resultado registrado)

---

## ❓ FAQ

**P: ¿Por qué mi partido está en BLOQUEADO?**
A: Automáticamente se bloquea 1 hora antes del inicio. Verifica que la fecha/hora sea correcta.

**P: ¿Puedo editar equipos de un partido BLOQUEADO?**
A: No, solo se pueden editar partidos ABIERTOS. El error será: "No se pueden cambiar equipos..."

**P: ¿Qué pasa cuando registro un resultado?**
A: El partido se finaliza automáticamente y se reparten puntos al ranking.

**P: ¿Si me equivoco registrando un resultado?**
A: Contacta al administrador del sistema para revertir el estado a BLOQUEADO.

---

## 🚀 Cambios Implementados

1. ✅ **Serializer**: Forzar ABIERTO al crear (`PartidoCreateUpdateSerializer`)
2. ✅ **Validación**: No permitir editar equipos cuando está BLOQUEADO
3. ✅ **Bloqueo automático**: Se ejecuta en cada request (`verificar_bloqueos_partidos`)
4. ✅ **Finalización automática**: Al registrar resultado (`evaluar_resultado_partido`)

