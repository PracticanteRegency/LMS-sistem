#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de comparación datosActual vs empresas macro.
Genera SQL de migración respetando:
  - NO cambiar asociación centro_op ↔ usuarios/registroexamenes
  - SÍ editar asociación proyecto ↔ unidad
  - Crear nuevas unidades/proyectos/centros si no existen

Ejecutar con: docker exec backend python manage.py shell < analitica/template/comparar_y_migrar.py
"""
import os, sys, csv

from analitica.models import Epresa, Unidadnegocio, Proyecto, Centroop

# ─────────────────────────────────────────────
# 1) Leer estado actual de la BD
# ─────────────────────────────────────────────
empresas_db = {}
for e in Epresa.objects.filter(estadoempresa=1):
    empresas_db[e.nombre_empresa.strip().upper()] = e

unidades_db = {}   # key: (empresa_id, nombre, desc) → obj
for u in Unidadnegocio.objects.filter(estadounidad=1):
    key = (u.id_empresa_id, u.nombreunidad.strip().upper(), u.descripcionunidad.strip().upper())
    unidades_db[key] = u

proyectos_db = {}  # key: (unidad_id, nombre) → obj
for p in Proyecto.objects.filter(estadoproyecto=1):
    key = (p.id_unidad_id, p.nombreproyecto.strip().upper())
    proyectos_db[key] = p

centros_db = {}    # key: (proyecto_id, nombre) → obj
for c in Centroop.objects.filter(estadocentrop=1):
    key = (c.id_proyecto_id, c.nombrecentrop.strip().upper())
    centros_db[key] = c

# ─────────────────────────────────────────────
# 2) Leer empresas macro (estado deseado)
# ─────────────────────────────────────────────
macro_path = '/app/analitica/template/empresas macro.csv'
macro_rows = []
with open(macro_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        macro_rows.append({
            'empresa':  row['Nombre de empresa'].strip().upper(),
            'unidad':   row['Desc UN'].strip().upper(),                    # nombreunidad (nombre)
            'desc_un':  row['UNIDAD DE NEGOCIO - ÁREA'].strip().upper(),  # descripcionunidad (descripción)
            'proyecto': row['Nombre Proyecto'].strip().upper(),
            'centro':   row['Desc CO'].strip().upper(),
        })

# ─────────────────────────────────────────────
# 3) Comparar y determinar acciones
# ─────────────────────────────────────────────
sql_statements = []
nuevas_unidades = []
nuevos_proyectos = []
nuevos_centros = []
reasignaciones_proyecto = []
faltantes = []

print("=" * 80)
print("ANÁLISIS DE MIGRACIÓN: empresas macro → BD")
print("=" * 80)

for row in macro_rows:
    emp_name = row['empresa']
    uni_name = row['unidad']
    uni_desc = row['desc_un']
    proy_name = row['proyecto']
    centro_name = row['centro']
    
    # 3a) Verificar empresa existe
    emp = empresas_db.get(emp_name)
    if not emp:
        print(f"[ERROR] Empresa no encontrada: {emp_name}")
        continue
    
    emp_id = emp.idempresa
    
    # 3b) Buscar unidad (empresa_id, nombre, desc)
    uni_key = (emp_id, uni_name, uni_desc)
    uni = unidades_db.get(uni_key)
    
    if not uni:
        # Verificar si existe con otro nombre pero misma desc, o crear
        # Buscar si ya la programamos para crear
        existing_new = [n for n in nuevas_unidades if n['key'] == uni_key]
        if not existing_new:
            nuevas_unidades.append({
                'key': uni_key,
                'empresa_id': emp_id,
                'empresa_name': emp_name,
                'nombre': uni_name,
                'desc': uni_desc,
            })
        uni_ref = f"@new_uni_{len([n for n in nuevas_unidades if n['key'] == uni_key]) - 1}_{uni_name}_{uni_desc}"
    else:
        uni_ref = uni.idunidad
    
    # 3c) Buscar proyecto bajo esa unidad
    if uni:
        proy_key = (uni.idunidad, proy_name)
        proy = proyectos_db.get(proy_key)
    else:
        proy = None
        # Buscar si existe el proyecto bajo OTRA unidad de la misma empresa
        # (para posible reasignación)
        for (uid, pname), p in proyectos_db.items():
            if pname == proy_name:
                # Verificar que pertenece a la misma empresa
                uni_obj = unidades_db.get(next((k for k, v in unidades_db.items() if v.idunidad == uid), None))
                # No reasignar, mejor crear nuevo
                pass
    
    if not proy and uni:
        # Proyecto no existe bajo esa unidad → crear
        proy_key_check = (uni.idunidad, proy_name)
        existing_new_proy = [n for n in nuevos_proyectos 
                            if n['unidad_id'] == uni.idunidad and n['nombre'] == proy_name]
        if not existing_new_proy:
            nuevos_proyectos.append({
                'unidad_id': uni.idunidad,
                'unidad_name': uni_name,
                'nombre': proy_name,
                'empresa_name': emp_name,
                'uni_desc': uni_desc,
            })
    elif not proy and not uni:
        # Tanto unidad como proyecto son nuevos
        existing_new_proy = [n for n in nuevos_proyectos 
                            if n.get('new_uni_key') == uni_key and n['nombre'] == proy_name]
        if not existing_new_proy:
            nuevos_proyectos.append({
                'unidad_id': None,  # se asignará cuando se cree la unidad
                'new_uni_key': uni_key,
                'unidad_name': uni_name,
                'nombre': proy_name,
                'empresa_name': emp_name,
                'uni_desc': uni_desc,
            })
    
    # 3d) Buscar centro op bajo ese proyecto
    if proy:
        centro_key = (proy.idproyecto, centro_name)
        centro = centros_db.get(centro_key)
        if not centro:
            existing_new_centro = [n for n in nuevos_centros 
                                   if n.get('proyecto_id') == proy.idproyecto and n['nombre'] == centro_name]
            if not existing_new_centro:
                nuevos_centros.append({
                    'proyecto_id': proy.idproyecto,
                    'proyecto_name': proy_name,
                    'nombre': centro_name,
                    'empresa_name': emp_name,
                    'unidad_name': uni_name,
                    'uni_desc': uni_desc,
                })
    else:
        # Centro nuevo bajo proyecto nuevo
        existing_new_centro = [n for n in nuevos_centros 
                               if n.get('new_proy_key') == (uni_key, proy_name) and n['nombre'] == centro_name]
        if not existing_new_centro:
            nuevos_centros.append({
                'proyecto_id': None,
                'new_proy_key': (uni_key, proy_name),
                'proyecto_name': proy_name,
                'nombre': centro_name,
                'empresa_name': emp_name,
                'unidad_name': uni_name,
                'uni_desc': uni_desc,
            })

# ─────────────────────────────────────────────
# 4) Imprimir resultados
# ─────────────────────────────────────────────
print(f"\n{'─' * 80}")
print(f"REGISTROS QUE YA EXISTEN EN LA BD (no requieren cambios)")
print(f"{'─' * 80}")

existentes = 0
for row in macro_rows:
    emp = empresas_db.get(row['empresa'])
    if not emp:
        continue
    uni_key = (emp.idempresa, row['unidad'], row['desc_un'])
    uni = unidades_db.get(uni_key)
    if not uni:
        continue
    proy = proyectos_db.get((uni.idunidad, row['proyecto']))
    if not proy:
        continue
    centro = centros_db.get((proy.idproyecto, row['centro']))
    if centro:
        existentes += 1

print(f"  Total registros que ya coinciden: {existentes} de {len(macro_rows)}")

# --- NUEVAS UNIDADES ---
print(f"\n{'─' * 80}")
print(f"NUEVAS UNIDADES A CREAR ({len(nuevas_unidades)})")
print(f"{'─' * 80}")
for i, u in enumerate(nuevas_unidades):
    print(f"  [{i+1}] Empresa: {u['empresa_name']}")
    print(f"       Nombre: {u['nombre']}")
    print(f"       Descripción: {u['desc']}")
    print(f"       SQL: INSERT INTO unidadnegocio (nombreunidad, descripcionUnidad, estadoUnidad, id_empresa)")
    print(f"            VALUES ('{u['nombre']}', '{u['desc']}', 1, {u['empresa_id']});")
    print()

# --- NUEVOS PROYECTOS ---
print(f"\n{'─' * 80}")
print(f"NUEVOS PROYECTOS A CREAR ({len(nuevos_proyectos)})")
print(f"{'─' * 80}")
for i, p in enumerate(nuevos_proyectos):
    uni_id_str = str(p['unidad_id']) if p['unidad_id'] else f"(nueva unidad: {p['unidad_name']} / {p['uni_desc']})"
    print(f"  [{i+1}] Empresa: {p['empresa_name']}")
    print(f"       Proyecto: {p['nombre']}")
    print(f"       Bajo unidad ID: {uni_id_str}")
    if p['unidad_id']:
        print(f"       SQL: INSERT INTO proyecto (nombreProyecto, estadoProyecto, id_unidad)")
        print(f"            VALUES ('{p['nombre']}', 1, {p['unidad_id']});")
    else:
        print(f"       SQL: (depende de ID de nueva unidad)")
    print()

# --- NUEVOS CENTROS OP ---
print(f"\n{'─' * 80}")
print(f"NUEVOS CENTROS OP A CREAR ({len(nuevos_centros)})")
print(f"{'─' * 80}")
for i, c in enumerate(nuevos_centros):
    proy_id_str = str(c['proyecto_id']) if c['proyecto_id'] else f"(nuevo proyecto: {c['proyecto_name']})"
    print(f"  [{i+1}] Empresa: {c['empresa_name']}")
    print(f"       Unidad: {c['unidad_name']} ({c['uni_desc']})")
    print(f"       Proyecto: {c['proyecto_name']}")
    print(f"       Centro Op: {c['nombre']}")
    print(f"       Bajo proyecto ID: {proy_id_str}")
    if c['proyecto_id']:
        print(f"       SQL: INSERT INTO centroop (nombreCentrOp, estadoCentrOp, Id_proyecto)")
        print(f"            VALUES ('{c['nombre']}', 1, {c['proyecto_id']});")
    else:
        print(f"       SQL: (depende de ID de nuevo proyecto)")
    print()

# ─────────────────────────────────────────────
# 5) Datos en datosActual que NO están en macro
# ─────────────────────────────────────────────
print(f"\n{'─' * 80}")
print(f"REGISTROS EN datosActual QUE NO ESTÁN EN empresas macro")
print(f"{'─' * 80}")

actual_path = '/app/analitica/template/datosActual.csv'
actual_rows = []
with open(actual_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        actual_rows.append({
            'empresa':  row['nombre_empresa'].strip().upper(),
            'unidad':   row['nombreunidad'].strip().upper(),
            'desc_un':  row['descripcionUnidad'].strip().upper(),
            'proyecto': row['nombreProyecto'].strip().upper(),
            'centro':   row['nombreCentrOp'].strip().upper(),
        })

macro_set = set()
for row in macro_rows:
    macro_set.add((row['empresa'], row['unidad'], row['desc_un'], row['proyecto'], row['centro']))

solo_en_actual = []
for row in actual_rows:
    # Buscar en macro con el nombre de unidad que le correspondería
    # En datosActual la unidad es el nombre viejo, en macro es el nuevo
    key = (row['empresa'], row['unidad'], row['desc_un'], row['proyecto'], row['centro'])
    if key not in macro_set:
        solo_en_actual.append(row)

for r in solo_en_actual:
    print(f"  {r['empresa']} | {r['unidad']} | {r['desc_un']} | {r['proyecto']} | {r['centro']}")

print(f"\n  Total solo en datosActual: {len(solo_en_actual)}")

# ─────────────────────────────────────────────
# 6) Resumen final
# ─────────────────────────────────────────────
print(f"\n{'=' * 80}")
print(f"RESUMEN FINAL")
print(f"{'=' * 80}")
print(f"  Registros en empresas macro:        {len(macro_rows)}")
print(f"  Ya existen en BD:                   {existentes}")
print(f"  Nuevas unidades a crear:            {len(nuevas_unidades)}")
print(f"  Nuevos proyectos a crear:           {len(nuevos_proyectos)}")
print(f"  Nuevos centros op a crear:          {len(nuevos_centros)}")
print(f"  Registros solo en datosActual:      {len(solo_en_actual)}")
