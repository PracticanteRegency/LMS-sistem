"""
Script de migración: reorganizar estructura según empresas macro.csv
Ejecutar: cmd /c "docker exec -i backend python manage.py shell < analitica/template/migrar_estructura.py"

Reglas:
  1. NO cambiar asociación centro_op ↔ usuarios/registroexamenes
  2. SÍ renombrar unidades (si misma descripción)
  3. SÍ reasignar proyecto→unidad (cambiar id_unidad)
  4. CREAR nuevas unidades/proyectos/centros si no existen
  5. Listar IDs de todo lo nuevo
"""
import csv
from collections import defaultdict
from analitica.models import Epresa, Unidadnegocio, Proyecto, Centroop

# ══════════════════════════════════════════════════════════════
# 1) Cargar BD actual
# ══════════════════════════════════════════════════════════════
empresas = {e.nombre_empresa.strip().upper(): e for e in Epresa.objects.filter(estadoempresa=1)}
unidades = list(Unidadnegocio.objects.filter(estadounidad=1))
proyectos = list(Proyecto.objects.filter(estadoproyecto=1))
centros = list(Centroop.objects.filter(estadocentrop=1))

# Índices rápidos
uni_by_emp_name_desc = {}  # (emp_id, nombre, desc) → unidad
for u in unidades:
    k = (u.id_empresa_id, u.nombreunidad.strip().upper(), u.descripcionunidad.strip().upper())
    uni_by_emp_name_desc[k] = u

# También indexar por (emp_id, desc) para detectar posibles renames
uni_by_emp_desc = defaultdict(list)
for u in unidades:
    k = (u.id_empresa_id, u.descripcionunidad.strip().upper())
    uni_by_emp_desc[k].append(u)

proy_by_uni_name = {}  # (unidad_id, nombre) → proyecto
for p in proyectos:
    k = (p.id_unidad_id, p.nombreproyecto.strip().upper())
    proy_by_uni_name[k] = p

centro_by_proy_name = {}  # (proyecto_id, nombre) → centro
for c in centros:
    k = (c.id_proyecto_id, c.nombrecentrop.strip().upper())
    centro_by_proy_name[k] = c

# ══════════════════════════════════════════════════════════════
# 2) Leer empresas macro (estado deseado)
# ══════════════════════════════════════════════════════════════
macro_path = '/app/analitica/template/empresas macro.csv'
macro_rows = []
with open(macro_path, 'r', encoding='utf-8-sig') as f:
    for row in csv.DictReader(f, delimiter=';'):
        macro_rows.append({
            'empresa': row['Nombre de empresa'].strip().upper(),
            'unidad': row['UNIDAD DE NEGOCIO - ÁREA'].strip().upper(),
            'desc_un': row['Desc UN'].strip().upper(),
            'proyecto': row['Nombre Proyecto'].strip().upper(),
            'centro': row['Desc CO'].strip().upper(),
        })

# ══════════════════════════════════════════════════════════════
# 3) Determinar todas las combinaciones únicas necesarias
# ══════════════════════════════════════════════════════════════

# Unidades únicas necesarias: (emp, nombre_uni, desc_uni)
macro_unidades = set()
# Proyectos únicos: (emp, nombre_uni, desc_uni, nombre_proy)
macro_proyectos = set()
# Centros únicos: (emp, nombre_uni, desc_uni, nombre_proy, nombre_centro)
macro_centros = set()

for r in macro_rows:
    macro_unidades.add((r['empresa'], r['unidad'], r['desc_un']))
    macro_proyectos.add((r['empresa'], r['unidad'], r['desc_un'], r['proyecto']))
    macro_centros.add((r['empresa'], r['unidad'], r['desc_un'], r['proyecto'], r['centro']))

# ══════════════════════════════════════════════════════════════
# 4) FASE A: Analizar UNIDADES → renames vs creates
# ══════════════════════════════════════════════════════════════
print("=" * 90)
print("FASE A: ANÁLISIS DE UNIDADES")
print("=" * 90)

sql_renames = []      # UPDATE statements para renombrar
sql_new_units = []    # INSERT statements para crear
rename_map = {}       # (emp_id, new_name, desc) → unidad_obj (tras rename)
new_unit_refs = {}    # (emp_name, uni_name, desc) → placeholder

for (emp_name, uni_name, desc_un) in sorted(macro_unidades):
    emp = empresas.get(emp_name)
    if not emp:
        print(f"  [SKIP] Empresa no encontrada: {emp_name}")
        continue

    emp_id = emp.idempresa
    key = (emp_id, uni_name, desc_un)

    # ¿Ya existe exacto?
    if key in uni_by_emp_name_desc:
        u = uni_by_emp_name_desc[key]
        print(f"  [OK]     Unidad {u.idunidad}: {uni_name} / {desc_un} (emp {emp_name[:30]})")
        continue

    # ¿Existe con MISMA desc pero DIFERENTE nombre? → candidato a RENAME
    candidates = uni_by_emp_desc.get((emp_id, desc_un), [])
    # Filtrar: solo las que NO están ya mapeadas a otro nombre en macro
    # y que tengan un nombre diferente al deseado
    rename_candidate = None
    for cand in candidates:
        cand_name = cand.nombreunidad.strip().upper()
        cand_desc = cand.descripcionunidad.strip().upper()
        # Verificar que esta unidad actual NO coincide ya con otra fila de macro
        # (es decir, que no la necesitamos con su nombre actual)
        cand_key = (emp_name, cand_name, cand_desc)
        if cand_key in macro_unidades:
            # Esta unidad ya se necesita con su nombre actual, no podemos renombrarla
            continue
        # Verificar que no fue ya asignada a otro rename
        already_renamed = any(
            v.idunidad == cand.idunidad for v in rename_map.values()
        )
        if already_renamed:
            continue
        rename_candidate = cand
        break

    if rename_candidate:
        old_name = rename_candidate.nombreunidad.strip()
        print(f"  [RENAME] Unidad {rename_candidate.idunidad}: '{old_name}' → '{uni_name}' (desc: {desc_un}, emp {emp_name[:30]})")
        sql_renames.append(
            f"UPDATE unidadnegocio SET nombreunidad = '{uni_name}' "
            f"WHERE idunidad = {rename_candidate.idunidad}; "
            f"-- era '{old_name}'"
        )
        rename_map[(emp_id, uni_name, desc_un)] = rename_candidate
        # Actualizar índice
        uni_by_emp_name_desc[key] = rename_candidate
    else:
        print(f"  [CREATE] Nueva unidad: {uni_name} / {desc_un} (emp {emp_name[:30]})")
        sql_new_units.append({
            'emp_id': emp_id,
            'emp_name': emp_name,
            'nombre': uni_name,
            'desc': desc_un,
        })
        new_unit_refs[(emp_name, uni_name, desc_un)] = True

# ══════════════════════════════════════════════════════════════
# 5) FASE B: Analizar PROYECTOS → reasignar vs crear
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 90}")
print("FASE B: ANÁLISIS DE PROYECTOS")
print("=" * 90)

sql_new_proyectos = []

for (emp_name, uni_name, desc_un, proy_name) in sorted(macro_proyectos):
    emp = empresas.get(emp_name)
    if not emp:
        continue
    emp_id = emp.idempresa

    # Buscar unidad (ya sea existente, renombrada, o pendiente de crear)
    uni_key = (emp_id, uni_name, desc_un)
    uni = uni_by_emp_name_desc.get(uni_key)

    if uni:
        uni_id = uni.idunidad
        proy_key = (uni_id, proy_name)
        proy = proy_by_uni_name.get(proy_key)
        if proy:
            print(f"  [OK]     Proyecto {proy.idproyecto}: {proy_name} → unidad {uni_id} ({uni_name})")
        else:
            print(f"  [CREATE] Proyecto: {proy_name} → unidad {uni_id} ({uni_name} / {desc_un})")
            sql_new_proyectos.append({
                'unidad_id': uni_id,
                'nombre': proy_name,
                'emp_name': emp_name,
                'uni_name': uni_name,
                'desc_un': desc_un,
                'needs_new_unit': False,
            })
    else:
        # Unidad aún no existe (se creará)
        print(f"  [CREATE] Proyecto: {proy_name} → nueva unidad ({uni_name} / {desc_un})")
        sql_new_proyectos.append({
            'unidad_id': None,
            'nombre': proy_name,
            'emp_name': emp_name,
            'uni_name': uni_name,
            'desc_un': desc_un,
            'needs_new_unit': True,
        })

# ══════════════════════════════════════════════════════════════
# 6) FASE C: Analizar CENTROS OP → crear faltantes
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 90}")
print("FASE C: ANÁLISIS DE CENTROS OPERATIVOS")
print("=" * 90)

sql_new_centros = []

for (emp_name, uni_name, desc_un, proy_name, centro_name) in sorted(macro_centros):
    emp = empresas.get(emp_name)
    if not emp:
        continue
    emp_id = emp.idempresa

    uni_key = (emp_id, uni_name, desc_un)
    uni = uni_by_emp_name_desc.get(uni_key)

    if uni:
        proy = proy_by_uni_name.get((uni.idunidad, proy_name))
        if proy:
            centro = centro_by_proy_name.get((proy.idproyecto, centro_name))
            if centro:
                # Ya existe todo ✓
                continue
            else:
                print(f"  [CREATE] Centro: {centro_name} → proy {proy.idproyecto} ({proy_name})")
                sql_new_centros.append({
                    'proyecto_id': proy.idproyecto,
                    'nombre': centro_name,
                    'emp_name': emp_name,
                    'uni_name': uni_name,
                    'proy_name': proy_name,
                    'needs_new_proy': False,
                    'needs_new_unit': False,
                })
        else:
            print(f"  [CREATE] Centro: {centro_name} → nuevo proy ({proy_name}) → unidad {uni.idunidad}")
            sql_new_centros.append({
                'proyecto_id': None,
                'nombre': centro_name,
                'emp_name': emp_name,
                'uni_name': uni_name,
                'proy_name': proy_name,
                'needs_new_proy': True,
                'needs_new_unit': False,
            })
    else:
        print(f"  [CREATE] Centro: {centro_name} → nuevo proy ({proy_name}) → nueva unidad ({uni_name}/{desc_un})")
        sql_new_centros.append({
            'proyecto_id': None,
            'nombre': centro_name,
            'emp_name': emp_name,
            'uni_name': uni_name,
            'proy_name': proy_name,
            'needs_new_proy': True,
            'needs_new_unit': True,
        })

# ══════════════════════════════════════════════════════════════
# 7) GENERAR SQL EJECUTABLE
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 90}")
print("SQL DE MIGRACIÓN")
print("=" * 90)

print("\n-- ═══ PASO 1: RENOMBRAR UNIDADES (safe: misma desc, mismos IDs) ═══")
for sql in sql_renames:
    print(sql)

print(f"\n-- ═══ PASO 2: CREAR {len(sql_new_units)} NUEVAS UNIDADES ═══")
for u in sql_new_units:
    print(f"INSERT INTO unidadnegocio (nombreunidad, descripcionUnidad, estadoUnidad, id_empresa) "
          f"VALUES ('{u['nombre']}', '{u['desc']}', 1, {u['emp_id']}); "
          f"-- {u['emp_name'][:40]}")

print(f"\n-- ═══ PASO 3: CREAR {len(sql_new_proyectos)} NUEVOS PROYECTOS ═══")
for p in sql_new_proyectos:
    if p['unidad_id']:
        print(f"INSERT INTO proyecto (nombreProyecto, estadoProyecto, id_unidad) "
              f"VALUES ('{p['nombre']}', 1, {p['unidad_id']}); "
              f"-- {p['emp_name'][:30]} → {p['uni_name']}")
    else:
        print(f"-- PENDIENTE (necesita ID de nueva unidad '{p['uni_name']}' / '{p['desc_un']}'): "
              f"INSERT INTO proyecto (nombreProyecto, estadoProyecto, id_unidad) "
              f"VALUES ('{p['nombre']}', 1, ???);")

print(f"\n-- ═══ PASO 4: CREAR {len(sql_new_centros)} NUEVOS CENTROS OP ═══")
for c in sql_new_centros:
    if c['proyecto_id']:
        print(f"INSERT INTO centroop (nombreCentrOp, estadoCentrOp, Id_proyecto) "
              f"VALUES ('{c['nombre']}', 1, {c['proyecto_id']}); "
              f"-- proy: {c['proy_name']}")
    else:
        label = f"proy nuevo: {c['proy_name']}"
        if c['needs_new_unit']:
            label += f" → uni nueva: {c['uni_name']}"
        print(f"-- PENDIENTE ({label}): "
              f"INSERT INTO centroop (nombreCentrOp, estadoCentrOp, Id_proyecto) "
              f"VALUES ('{c['nombre']}', 1, ???);")

# ══════════════════════════════════════════════════════════════
# 8) RESUMEN FINAL
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 90}")
print("RESUMEN")
print("=" * 90)
print(f"  Registros en empresas macro:       {len(macro_rows)}")
print(f"  Unidades a RENOMBRAR:              {len(sql_renames)}")
print(f"  Unidades a CREAR:                  {len(sql_new_units)}")
print(f"  Proyectos a CREAR:                 {len(sql_new_proyectos)}")
print(f"  Centros Op a CREAR:                {len(sql_new_centros)}")
total = len(sql_renames) + len(sql_new_units) + len(sql_new_proyectos) + len(sql_new_centros)
print(f"  TOTAL operaciones SQL:             {total}")

# Registros sobrantes en datosActual
actual_path = '/app/analitica/template/datosActual.csv'
with open(actual_path, 'r', encoding='utf-8-sig') as f:
    actual_set = set()
    for row in csv.DictReader(f, delimiter=';'):
        actual_set.add((
            row['nombre_empresa'].strip().upper(),
            row['nombreunidad'].strip().upper(),
            row['descripcionUnidad'].strip().upper(),
            row['nombreProyecto'].strip().upper(),
            row['nombreCentrOp'].strip().upper(),
        ))
macro_set = set((r['empresa'], r['unidad'], r['desc_un'], r['proyecto'], r['centro']) for r in macro_rows)
solo_actual = actual_set - macro_set
print(f"\n  Registros en datosActual NO en macro: {len(solo_actual)}")
if solo_actual:
    print("  (estos quedarían como están, usuarios no se afectan)")
    for r in sorted(solo_actual):
        print(f"    → {r[0][:30]}.. | {r[1]} | {r[2]} | {r[3]} | {r[4]}")
