#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para reorganizar datosActual.csv según la estructura de empresas macro.csv
Mapea las unidades de negocio a sus variantes más específicas en base a patrones.
"""

import csv
from collections import defaultdict

# Mapeo de transformaciones: (empresa, unidad_actual, descripcion) -> nueva_unidad_area
MAPPINGS = {
    # PEAJES Y BASCULAS -> PEAJES Y BASCULAS
    ('CONSORCIO PEAJES 2526', 'PEAJES Y BASCULAS', 'PEAJES Y BASCULAS'): 'PEAJES Y BASCULAS',
    
    # PROTINCO - PEAJES Y BASCULAS (mayoría se mantiene)
    ('PROTECCION DE INFRAESTRUCTURA COLOMBIA - PROTINCO LTDA', 'PEAJES Y BASCULAS', 'PEAJES Y BASCULAS'): 'PEAJES Y BASCULAS',
    
    # PROTINCO - VIGILANCIA -> SEGURIDAD Y VIGILANCIA o VIGILANCIA
    ('PROTECCION DE INFRAESTRUCTURA COLOMBIA - PROTINCO LTDA', 'VIGILANCIA', 'VIGILANCIA'): 'SEGURIDAD Y VIGILANCIA',
    
    # PROTINCO - GERENCIAS -> varias opciones según proyecto
    ('PROTECCION DE INFRAESTRUCTURA COLOMBIA - PROTINCO LTDA', 'GERENCIAS', 'GERENCIAS'): 'GERENCIA DE OPERACIONES',
    
    # PROTINCO - ADMINISTRACION -> ADMINISTRACION
    ('PROTECCION DE INFRAESTRUCTURA COLOMBIA - PROTINCO LTDA', 'ADMINISTRACION', 'ADMINISTRACION'): 'ADMINISTRACION',
    
    # REGENCY HEALTH SERVICES
    ('REGENCY HEALTH SERVICES S.A.S', 'GERENCIAS', 'GERENCIAS'): 'GERENCIA DE OPERACIONES',
    ('REGENCY HEALTH SERVICES S.A.S', 'OPERACION VIAL', 'OPERACION VIAL'): 'OPERACIÓN VIAL',
    ('REGENCY HEALTH SERVICES S.A.S', 'ADMINISTRACION', 'ADMINISTRACION'): 'ADMINISTRACION',
    
    # REGENCY SERVICES
    ('REGENCY SERVICES DE COLOMBIA S.A.S', 'ADMINISTRACION', 'ADMINISTRACION'): 'ADMINISTRACION',
    ('REGENCY SERVICES DE COLOMBIA S.A.S', 'GERENCIAS', 'GERENCIAS'): 'GERENCIA DE OPERACIONES',
    ('REGENCY SERVICES DE COLOMBIA S.A.S', 'OPERACION VIAL', 'OPERACION VIAL'): 'OPERACIÓN VIAL',
    ('REGENCY SERVICES DE COLOMBIA S.A.S', 'PEAJES Y BASCULAS', 'PEAJES Y BASCULAS'): 'PEAJES Y BASCULAS',
    
    # REGENCY TECH
    ('REGENCY TECH S.A.S', 'GERENCIAS', 'GERENCIAS'): 'GERENCIA DE OPERACIONES',
}

def read_csv(filename):
    """Lee el CSV y retorna lista de diccionarios"""
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        return list(reader)

def write_csv(filename, data, fieldnames):
    """Escribe datos a CSV"""
    with open(filename, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=';')
        writer.writeheader()
        writer.writerows(data)

def transform_data(rows):
    """Transforma los datos de datosActual al formato de empresas macro"""
    new_rows = []
    
    for row in rows:
        empresa = row['nombre_empresa']
        unidad = row['nombreunidad']
        desc = row['descripcionUnidad']
        proyecto = row['nombreProyecto']
        centro = row['nombreCentrOp']
        
        # Buscar la transformación correspondiente
        key = (empresa, unidad, desc)
        nueva_unidad = MAPPINGS.get(key, unidad)  # Si no hay mapeo, mantener original
        
        new_row = {
            'Nombre de empresa': empresa,
            'UNIDAD DE NEGOCIO - ÁREA': nueva_unidad,
            'Desc UN': desc,
            'Nombre Proyecto': proyecto,
            'Desc CO': centro
        }
        new_rows.append(new_row)
    
    return new_rows

def main():
    # Leer datos actuales
    print("Leyendo datosActual.csv...")
    rows = read_csv('backend/analitica/template/datosActual.csv')
    print(f"✓ Leídas {len(rows)} filas")
    
    # Transformar
    print("\nTransformando datos...")
    new_rows = transform_data(rows)
    print(f"✓ Transformadas {len(new_rows)} filas")
    
    # Escribir resultado
    print("\nEscribiendo datosActual_reorganizado.csv...")
    fieldnames = ['Nombre de empresa', 'UNIDAD DE NEGOCIO - ÁREA', 'Desc UN', 'Nombre Proyecto', 'Desc CO']
    write_csv('backend/analitica/template/datosActual_reorganizado.csv', new_rows, fieldnames)
    print("✓ Archivo creado")
    
    # Mostrar resumen
    print("\n=== RESUMEN DE CAMBIOS ===")
    print("\nUnidades únicas en resultado:")
    unidades = set(row['UNIDAD DE NEGOCIO - ÁREA'] for row in new_rows)
    for u in sorted(unidades):
        count = len([r for r in new_rows if r['UNIDAD DE NEGOCIO - ÁREA'] == u])
        print(f"  - {u}: {count} filas")

if __name__ == '__main__':
    main()
