#!/usr/bin/env python3
"""
Script de prueba local para validar la lógica de detección de CSV
sin necesidad de enviar el archivo al servidor.
"""

import csv
import io

# Simular el contenido del CSV EXAMENES PRIMER TRIMESTRE
csv_sample = """Nombre de empresa;unidad de negocio;PROYECTO;Desc. C.O.;Cedula;Nombre Empleado;Cargo;Fecha de Ingreso;TIPO DE EXAMEN;OPTOMETRIA;AUDIOMETRIA;EXAMEN OSTEOMUSCULAR;ENCUESTA DE SINTOMAS RESPIRATORIOS;CUESTIONARIO SINTOMAS RESPIRATORIOS OIT;CUADRO HEMATICO;GPT FOSFATA ALCALINA;CREATINA MICROALBUMINURIA;PRUEBA DE ORINA EN ACIDO  TT MUCONICO, ACCIDO HIPURICO Y ACIDO METILHIPURICO;CUESTIONARIO Q16 NEUROTOXICIDAD;PSICOSENSOMETRICO (CADA DOS A?OS);GLICEMIA;PERFIL LIPIDICO;PRUEBA PARA LA IDENTIFICACION DE ALCOHOL Y SPA;RADIOGRAFIA DE TORAX (CADA 5 A?OS);EXPIROMETRIA (CADA DOS A?OS;BPM (KOH U?AS FROTIS DE GARGANTA , COPROCULTIVO)
PROTINCO LTDA;PEAJES Y BASCULAS;ACCENORTE;PEAJE UNISABANA;35427191;ALVAREZ GARCIA ANA EDYD;CONTROLADOR OPERATIVO;10/02/2023;PERIODICO;1;1;1;1;;;;;;;;;;;;;"""

print("=" * 80)
print("PRUEBA DE DETECCIÓN DE DELIMITADOR Y FORMATO")
print("=" * 80)

# Test 1: Detectar delimitador
print("\n1. DETECCIÓN DE DELIMITADOR:")
print("-" * 80)

primera_linea = csv_sample.split('\n')[0]
print(f"Primera línea: {primera_linea[:100]}...")

contar_comas = primera_linea.count(',')
contar_puntoycoma = primera_linea.count(';')

print(f"Comas encontradas: {contar_comas}")
print(f"Puntos y comas encontrados: {contar_puntoycoma}")

delimiter = ';' if contar_puntoycoma > contar_comas and contar_puntoycoma > 0 else ','
print(f"✓ Delimitador seleccionado: '{delimiter}'")

# Test 2: Leer el CSV con el delimitador detectado
print("\n2. LECTURA DEL CSV:")
print("-" * 80)

stream = io.StringIO(csv_sample)
reader = csv.DictReader(stream, delimiter=delimiter)

if not reader.fieldnames:
    print("✗ ERROR: CSV sin encabezados")
else:
    fieldnames_original = [f.strip() for f in reader.fieldnames]
    fieldnames = [f.lower() for f in fieldnames_original]
    
    print(f"Total de columnas: {len(fieldnames)}")
    print(f"\nColumnas (normalizadas a minúsculas):")
    for i, col in enumerate(fieldnames, 1):
        print(f"  {i:2d}. {col}")

    # Test 3: Detectar formato
    print("\n3. DETECCIÓN DE FORMATO:")
    print("-" * 80)

    fieldnames_lower = fieldnames
    
    # Verificar si tiene 'tipo de examen'
    tipo_examen_idx = None
    for idx, col in enumerate(fieldnames_lower):
        if col == 'tipo de examen' or col == 'tipo examen' or col == 'tipoexamen':
            tipo_examen_idx = idx
            break
    
    if tipo_examen_idx is not None:
        print(f"✓ Columna 'TIPO DE EXAMEN' encontrada en índice {tipo_examen_idx}")
        
        # Las columnas después de 'tipo de examen' son los exámenes
        columnas_examenes = fieldnames_original[tipo_examen_idx + 1:]
        columnas_examenes = [c for c in columnas_examenes if c and c.strip()]
        
        print(f"✓ Formato detectado: COLUMNAS_EXAMENES")
        print(f"✓ Total de columnas de exámenes: {len(columnas_examenes)}")
        print(f"\nColumnas de exámenes:")
        for i, col in enumerate(columnas_examenes, 1):
            print(f"  {i:2d}. {col}")
        
        # Validar columnas requeridas
        print("\n4. VALIDACIÓN DE COLUMNAS REQUERIDAS:")
        print("-" * 80)
        
        expected_format2 = {
            'nombre de empresa', 'unidad de negocio', 'proyecto', 
            'desc. c.o.', 'cedula', 'nombre empleado', 'cargo', 
            'tipo de examen'
        }
        
        fieldnames_set = set(fieldnames_lower)
        missing = expected_format2 - fieldnames_set
        
        if not missing:
            print("✓ TODAS las columnas requeridas están presentes:")
            for col in sorted(expected_format2):
                print(f"  ✓ {col}")
        else:
            print(f"✗ Columnas faltantes: {missing}")
            for col in sorted(expected_format2):
                status = "✓" if col in fieldnames_set else "✗"
                print(f"  {status} {col}")
    else:
        print("✗ ERROR: No se encontró columna 'TIPO DE EXAMEN'")
        print(f"Columnas disponibles: {fieldnames_lower[:10]}...")

print("\n" + "=" * 80)
print("RESULTADO: El CSV debería procesarse correctamente con la lógica mejorada")
print("=" * 80)
