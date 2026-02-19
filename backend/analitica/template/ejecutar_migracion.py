"""
Script EJECUTABLE de migración: reorganizar estructura según empresas macro.csv

MAPEO CORRECTO (confirmado por usuario):
  - empresas macro 'UNIDAD DE NEGOCIO - ÁREA' = descripcionunidad (descripción en BD)
  - empresas macro 'Desc UN'                   = nombreunidad (nombre en BD)

Ejecutar: cmd /c "docker exec -i backend python manage.py shell < analitica/template/ejecutar_migracion.py"

REGLAS:
  1. NO tocar asociación centro_op ↔ usuarios/registroexamenes
  2. Actualizar descripción de unidades existentes si cambió
  3. Crear nuevas unidades/proyectos/centros donde falten
  4. Al final: listar TODOS los IDs nuevos y cambios
"""
import csv
from collections import defaultdict
from django.db import transaction
from analitica.models import Epresa, Unidadnegocio, Proyecto, Centroop

# ══════════════════════════════════════════
# CARGAR BD
# ══════════════════════════════════════════
empresas = {e.nombre_empresa.strip().upper(): e for e in Epresa.objects.filter(estadoempresa=1)}

def reload_indices():
    _unidades = list(Unidadnegocio.objects.filter(estadounidad=1))
    _proyectos = list(Proyecto.objects.filter(estadoproyecto=1))
    _centros = list(Centroop.objects.filter(estadocentrop=1))

    # key: (emp_id, nombreunidad, descripcionunidad) → obj
    uni_idx = {}
    for u in _unidades:
        k = (u.id_empresa_id, u.nombreunidad.strip().upper(), u.descripcionunidad.strip().upper())
        uni_idx[k] = u

    # key: (emp_id, nombreunidad) → [unidades] (para buscar candidatos a update desc)
    uni_by_emp_name = defaultdict(list)
    for u in _unidades:
        k = (u.id_empresa_id, u.nombreunidad.strip().upper())
        uni_by_emp_name[k].append(u)

    proy_idx = {}
    for p in _proyectos:
        k = (p.id_unidad_id, p.nombreproyecto.strip().upper())
        proy_idx[k] = p

    centro_idx = {}
    for c in _centros:
        k = (c.id_proyecto_id, c.nombrecentrop.strip().upper())
        centro_idx[k] = c

    return uni_idx, uni_by_emp_name, proy_idx, centro_idx

# ══════════════════════════════════════════
# LEER MACRO (con mapeo correcto)
# ══════════════════════════════════════════
macro_path = '/app/analitica/template/empresas macro.csv'
macro_rows = []
with open(macro_path, 'r', encoding='utf-8-sig') as f:
    for row in csv.DictReader(f, delimiter=';'):
        macro_rows.append({
            'empresa':    row['Nombre de empresa'].strip().upper(),
            'nombre_un':  row['Desc UN'].strip().upper(),                    # nombreunidad
            'desc_un':    row['UNIDAD DE NEGOCIO - ÁREA'].strip().upper(),   # descripcionunidad
            'proyecto':   row['Nombre Proyecto'].strip().upper(),
            'centro':     row['Desc CO'].strip().upper(),
        })

# Combos únicos
macro_unidades = set()    # (empresa, nombreunidad, descripcionunidad)
macro_proyectos = set()   # (empresa, nombreunidad, descripcionunidad, proyecto)
macro_centros_set = set() # (empresa, nombreunidad, descripcionunidad, proyecto, centro)
for r in macro_rows:
    macro_unidades.add((r['empresa'], r['nombre_un'], r['desc_un']))
    macro_proyectos.add((r['empresa'], r['nombre_un'], r['desc_un'], r['proyecto']))
    macro_centros_set.add((r['empresa'], r['nombre_un'], r['desc_un'], r['proyecto'], r['centro']))

print("ANÁLISIS DE DATOS MACRO:")
print(f"  Filas totales:          {len(macro_rows)}")
print(f"  Unidades únicas:        {len(macro_unidades)}")
print(f"  Proyectos únicos:       {len(macro_proyectos)}")
print(f"  Centros Op únicos:      {len(macro_centros_set)}")

# ══════════════════════════════════════════════════════════════
# FASE 1: ACTUALIZAR DESCRIPCIÓN DE UNIDADES EXISTENTES
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 90}")
print("FASE 1: ACTUALIZAR DESCRIPCIÓN DE UNIDADES")
print("=" * 90)

uni_idx, uni_by_emp_name, proy_idx, centro_idx = reload_indices()
updated_units = []

with transaction.atomic():
    for (emp_name, nombre_un, desc_un) in sorted(macro_unidades):
        emp = empresas.get(emp_name)
        if not emp:
            continue
        key = (emp.idempresa, nombre_un, desc_un)
        if key in uni_idx:
            continue  # ya existe exacto, nada que hacer

        # Buscar unidad con mismo nombre pero descripción diferente
        candidates = uni_by_emp_name.get((emp.idempresa, nombre_un), [])
        update_candidate = None
        for cand in candidates:
            cand_name = cand.nombreunidad.strip().upper()
            cand_desc = cand.descripcionunidad.strip().upper()
            # No actualizar si esa unidad ya se necesita con su desc actual
            if (emp_name, cand_name, cand_desc) in macro_unidades:
                continue
            # No actualizar si ya fue usada para otro update
            if any(u['id'] == cand.idunidad for u in updated_units):
                continue
            update_candidate = cand
            break

        if update_candidate:
            old_desc = update_candidate.descripcionunidad
            update_candidate.descripcionunidad = desc_un
            update_candidate.save()
            updated_units.append({
                'id': update_candidate.idunidad,
                'nombre': nombre_un,
                'old_desc': old_desc,
                'new_desc': desc_un,
                'empresa': emp_name[:50],
            })
            print(f"  ✅ UPDATE unidad {update_candidate.idunidad}: nombre='{nombre_un}' desc '{old_desc}' → '{desc_un}' ({emp_name[:40]})")

print(f"\n  Total actualizadas: {len(updated_units)}")

# ══════════════════════════════════════════════════════════════
# FASE 2: CREAR NUEVAS UNIDADES
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 90}")
print("FASE 2: CREAR NUEVAS UNIDADES")
print("=" * 90)

uni_idx, uni_by_emp_name, proy_idx, centro_idx = reload_indices()
new_units = []

with transaction.atomic():
    for (emp_name, nombre_un, desc_un) in sorted(macro_unidades):
        emp = empresas.get(emp_name)
        if not emp:
            continue
        key = (emp.idempresa, nombre_un, desc_un)
        if key in uni_idx:
            continue  # ya existe

        u = Unidadnegocio()
        u.nombreunidad = nombre_un
        u.descripcionunidad = desc_un
        u.estadounidad = 1
        u.id_empresa_id = emp.idempresa
        u.save()

        new_units.append({
            'id': u.idunidad,
            'nombre': nombre_un,
            'desc': desc_un,
            'empresa': emp_name[:50],
            'empresa_id': emp.idempresa,
        })
        uni_idx[key] = u
        print(f"  ✅ CREATE unidad {u.idunidad}: nombre='{nombre_un}' desc='{desc_un}' ({emp_name[:40]})")

print(f"\n  Total nuevas unidades: {len(new_units)}")

# ══════════════════════════════════════════════════════════════
# FASE 3: CREAR NUEVOS PROYECTOS
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 90}")
print("FASE 3: CREAR NUEVOS PROYECTOS")
print("=" * 90)

uni_idx, uni_by_emp_name, proy_idx, centro_idx = reload_indices()
new_proyectos = []

with transaction.atomic():
    for (emp_name, nombre_un, desc_un, proy_name) in sorted(macro_proyectos):
        emp = empresas.get(emp_name)
        if not emp:
            continue

        uni = uni_idx.get((emp.idempresa, nombre_un, desc_un))
        if not uni:
            print(f"  ❌ ERROR: Unidad no encontrada nombre='{nombre_un}' desc='{desc_un}' ({emp_name[:30]})")
            continue

        proy_key = (uni.idunidad, proy_name)
        if proy_key in proy_idx:
            continue  # ya existe

        p = Proyecto()
        p.nombreproyecto = proy_name
        p.estadoproyecto = 1
        p.id_unidad_id = uni.idunidad
        p.save()

        new_proyectos.append({
            'id': p.idproyecto,
            'nombre': proy_name,
            'unidad_id': uni.idunidad,
            'unidad_nombre': nombre_un,
            'unidad_desc': desc_un,
            'empresa': emp_name[:50],
        })
        proy_idx[proy_key] = p
        print(f"  ✅ CREATE proyecto {p.idproyecto}: '{proy_name}' → unidad {uni.idunidad} ({nombre_un}/{desc_un})")

print(f"\n  Total nuevos proyectos: {len(new_proyectos)}")

# ══════════════════════════════════════════════════════════════
# FASE 4: CREAR NUEVOS CENTROS OP
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 90}")
print("FASE 4: CREAR NUEVOS CENTROS OPERATIVOS")
print("=" * 90)

uni_idx, uni_by_emp_name, proy_idx, centro_idx = reload_indices()
new_centros = []

with transaction.atomic():
    for (emp_name, nombre_un, desc_un, proy_name, centro_name) in sorted(macro_centros_set):
        emp = empresas.get(emp_name)
        if not emp:
            continue

        uni = uni_idx.get((emp.idempresa, nombre_un, desc_un))
        if not uni:
            print(f"  ❌ ERROR: Unidad no encontrada nombre='{nombre_un}' desc='{desc_un}'")
            continue

        proy = proy_idx.get((uni.idunidad, proy_name))
        if not proy:
            print(f"  ❌ ERROR: Proyecto no encontrado '{proy_name}' bajo unidad {uni.idunidad}")
            continue

        centro_key = (proy.idproyecto, centro_name)
        if centro_key in centro_idx:
            continue  # ya existe

        c = Centroop()
        c.nombrecentrop = centro_name
        c.estadocentrop = 1
        c.id_proyecto_id = proy.idproyecto
        c.save()

        new_centros.append({
            'id': c.idcentrop,
            'nombre': centro_name,
            'proyecto_id': proy.idproyecto,
            'proyecto_name': proy_name,
            'unidad_id': uni.idunidad,
            'unidad_nombre': nombre_un,
            'unidad_desc': desc_un,
            'empresa': emp_name[:50],
        })
        centro_idx[centro_key] = c
        print(f"  ✅ CREATE centro {c.idcentrop}: '{centro_name}' → proy {proy.idproyecto} ({proy_name})")

print(f"\n  Total nuevos centros: {len(new_centros)}")

# ══════════════════════════════════════════════════════════════
# RESUMEN FINAL CON IDs
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 90}")
print("RESUMEN FINAL DE LA MIGRACIÓN")
print("=" * 90)

print(f"\n  Unidades ACTUALIZADAS (desc):  {len(updated_units)}")
print(f"  Unidades CREADAS:              {len(new_units)}")
print(f"  Proyectos CREADOS:             {len(new_proyectos)}")
print(f"  Centros Op CREADOS:            {len(new_centros)}")

if updated_units:
    print(f"\n{'─' * 90}")
    print("LISTADO: UNIDADES CON DESCRIPCIÓN ACTUALIZADA")
    print(f"{'─' * 90}")
    print(f"  {'ID':<6} {'NOMBRE':<25} {'DESC ANTES':<30} {'DESC DESPUÉS':<45} {'EMPRESA'}")
    for u in updated_units:
        print(f"  {u['id']:<6} {u['nombre']:<25} {u['old_desc']:<30} {u['new_desc']:<45} {u['empresa']}")

if new_units:
    print(f"\n{'─' * 90}")
    print("LISTADO: NUEVAS UNIDADES (con IDs)")
    print(f"{'─' * 90}")
    print(f"  {'ID':<6} {'NOMBRE':<25} {'DESCRIPCIÓN':<45} {'EMPRESA'}")
    for u in new_units:
        print(f"  {u['id']:<6} {u['nombre']:<25} {u['desc']:<45} {u['empresa']}")

if new_proyectos:
    print(f"\n{'─' * 90}")
    print("LISTADO: NUEVOS PROYECTOS (con IDs)")
    print(f"{'─' * 90}")
    print(f"  {'ID':<6} {'NOMBRE':<30} {'UNI_ID':<8} {'UNI NOMBRE':<20} {'UNI DESC':<40} {'EMPRESA'}")
    for p in new_proyectos:
        print(f"  {p['id']:<6} {p['nombre']:<30} {p['unidad_id']:<8} {p['unidad_nombre']:<20} {p['unidad_desc']:<40} {p['empresa']}")

if new_centros:
    print(f"\n{'─' * 90}")
    print("LISTADO: NUEVOS CENTROS OP (con IDs)")
    print(f"{'─' * 90}")
    print(f"  {'ID':<6} {'NOMBRE':<45} {'PROY_ID':<8} {'PROYECTO':<25} {'UNI DESC'}")
    for c in new_centros:
        print(f"  {c['id']:<6} {c['nombre']:<45} {c['proyecto_id']:<8} {c['proyecto_name']:<25} {c['unidad_desc']}")

print(f"\n{'=' * 90}")
print("✅ MIGRACIÓN COMPLETADA EXITOSAMENTE")
print("=" * 90)
