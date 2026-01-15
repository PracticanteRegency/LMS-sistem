import os
import sys
import django
import pandas as pd
from django.contrib.auth.hashers import make_password
from django.db import transaction

# ========================
# Configurar Django
# ========================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from usuarios.models import (
    Colaboradores,
    Usuarios,
    Cargo,
    Niveles,
    Regional
)

from analitica.models import Centroop


# ========================
# UTILIDADES
# ========================
def get_valor(fila, *columnas):
    """
    Retorna el primer valor NO vacío encontrado entre varias columnas
    (maneja columnas duplicadas: col, col.1, col.2, etc.)
    """
    for col in columnas:
        valor = fila.get(col)
        if pd.notna(valor) and str(valor).strip() != "":
            return str(valor).strip()
    return None


def separar_nombre_apellido(nombre_completo):
    """
    Reglas actualizadas:
    - 3 palabras → 2 apellidos + 1 nombre
    - 4 palabras → 2 apellidos + 2 nombres
    """
    if not nombre_completo:
        return None, None

    partes = nombre_completo.split()

    if len(partes) < 2:
        return None, None

    if len(partes) == 2:
        # 1 apellido, 1 nombre
        return partes[1], partes[0]

    if len(partes) == 3:
        # 2 apellidos, 1 nombre
        return " ".join(partes[:2]), partes[2]

    if len(partes) == 4:
        # 2 apellidos, 2 nombres
        return " ".join(partes[:2]), " ".join(partes[2:])

    # Más de 4 palabras: 2 apellidos, resto nombres
    return " ".join(partes[:2]), " ".join(partes[2:])


def obtener_email(fila):
    """
    Prioridad:
    1. corporativo
    2. email_del_contacto
    """
    corporativo = fila.get("corporativo")
    contacto = fila.get("email_del_contacto")

    if pd.notna(corporativo) and str(corporativo).strip():
        return corporativo.strip()

    if pd.notna(contacto) and str(contacto).strip():
        return contacto.strip()

    return None


# ========================
# CARGA PRINCIPAL
# ========================
def cargar_colaboradores_desde_excel():

    excel_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "templates",
        "Colaboradores.xlsx"
    )

    if not os.path.exists(excel_path):
        print(f"❌ No se encontró el archivo: {excel_path}")
        return

    # Leer Excel
    df = pd.read_excel(excel_path)

    # Normalizar columnas
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
    )

    print("📋 Columnas detectadas:")
    print(df.columns.tolist())
    print(f"📊 Filas encontradas: {len(df)}\n")

    # FKs fijas
    regional = Regional.objects.get(idregional=1)

    exitosos = 0
    errores = 0
    log_errores = []
    filas_validas = []

    for index, fila in df.iterrows():
        fila_num = index + 2  # Excel empieza en fila 2
        try:
            cedula = get_valor(fila, "empleado", "empleado.1")
            nombre_completo = get_valor(
                fila,
                "nombre_del_empleado",
                "nombre_del_empleado.1"
            )

            if not cedula or not nombre_completo:
                log_errores.append(f"Fila {fila_num}: Empleado o Nombre vacío")
                errores += 1
                continue

            nombre, apellido = separar_nombre_apellido(nombre_completo)

            if not nombre or not apellido:
                log_errores.append(f"Fila {fila_num}: Nombre inválido ({nombre_completo})")
                errores += 1
                continue

            email = obtener_email(fila)

            if not email:
                log_errores.append(f"Fila {fila_num}: Sin email válido")
                errores += 1
                continue

            usuario = cedula


            # Buscar nivel por nombre exacto en columna JERARQUIA
            nombre_nivel = get_valor(fila, "jerarquia")
            nivel = Niveles.objects.filter(nombrenivel__iexact=nombre_nivel).first()
            if not nivel:
                log_errores.append(f"Fila {fila_num}: Nivel '{nombre_nivel}' no encontrado")
                errores += 1
                continue

            # Buscar cargo por nombre exacto
            nombre_cargo = get_valor(fila, "desc_cargo")
            cargo = Cargo.objects.filter(nombrecargo__iexact=nombre_cargo).first()
            if not cargo:
                log_errores.append(f"Fila {fila_num}: Cargo '{nombre_cargo}' no encontrado")
                errores += 1
                continue

            # Buscar centro de operación por empresa, unidad, proyecto y centro op
            empresa_id = get_valor(fila, "empresa_id")
            nombre_unidad = get_valor(fila, "desc_un")
            nombre_proyecto = get_valor(fila, "nombre_proyecto")
            nombre_centro_op = get_valor(fila, "desc_co")

            # Buscar la unidad por nombre y empresa
            from analitica.models import Epresa, Unidadnegocio, Proyecto, Centroop
            unidad = Unidadnegocio.objects.filter(nombreunidad__iexact=nombre_unidad, id_empresa__idempresa=empresa_id).first()
            if not unidad:
                log_errores.append(f"Fila {fila_num}: Unidad '{nombre_unidad}' no encontrada para empresa {empresa_id}")
                errores += 1
                continue

            # Buscar el proyecto por nombre y unidad
            proyecto = Proyecto.objects.filter(nombreproyecto__iexact=nombre_proyecto, id_unidad=unidad.idunidad).first()
            if not proyecto:
                log_errores.append(f"Fila {fila_num}: Proyecto '{nombre_proyecto}' no encontrado para unidad {nombre_unidad}")
                errores += 1
                continue

            # Buscar el centro de operación por nombre y proyecto
            centro_op = Centroop.objects.filter(nombrecentrop__iexact=nombre_centro_op, id_proyecto=proyecto.idproyecto).first()
            if not centro_op:
                log_errores.append(f"Fila {fila_num}: Centro de operación '{nombre_centro_op}' no encontrado para proyecto {nombre_proyecto}")
                errores += 1
                continue

            if Colaboradores.objects.filter(cccolaborador=usuario).exists():
                log_errores.append(f"Fila {fila_num}: CC {usuario} ya existe")
                errores += 1
                continue

            # Si todo está bien, guardar la fila para procesar después
            filas_validas.append({
                "usuario": usuario,
                "nombre": nombre,
                "apellido": apellido,
                "cargo": cargo,
                "email": email,
                "nivel": nivel,
                "regional": regional,
                "centro_op": centro_op
            })
        except Exception as e:
            log_errores.append(f"Fila {fila_num}: {e}")
            errores += 1

    print("\n==============================")
    print("📋 LOG DE ERRORES")
    if log_errores:
        for err in log_errores:
            print(f"❌ {err}")
        print(f"\nNo se cargaron datos por errores detectados. Corrige los errores y vuelve a intentar.")
        print("==============================\n")
        return

    print("No se detectaron errores. Procediendo a cargar datos...\n")

    for fila in filas_validas:
        try:
            with transaction.atomic():
                colaborador = Colaboradores.objects.create(
                    cccolaborador=fila["usuario"],
                    nombrecolaborador=fila["nombre"],
                    apellidocolaborador=fila["apellido"],
                    cargocolaborador=fila["cargo"],
                    correocolaborador=fila["email"],
                    telefocolaborador=None,
                    estadocolaborador=1,
                    nivelcolaborador=fila["nivel"],
                    regionalcolab=fila["regional"],
                    centroop=fila["centro_op"]
                )

                Usuarios.objects.create(
                    usuario=fila["usuario"],
                    password=make_password(fila["usuario"]),
                    tipousuario=3,
                    idcolaboradoru=colaborador
                )
            print(f"✅ {fila['nombre']} {fila['apellido']} | CC {fila['usuario']}")
            exitosos += 1
        except Exception as e:
            print(f"❌ Error inesperado al guardar {fila['usuario']}: {e}")
            errores += 1

    print("\n==============================")
    print("📊 RESUMEN FINAL")
    print(f"✅ Exitosos: {exitosos}")
    print(f"❌ Errores: {errores}")
    print("==============================\n")


# ========================
# EJECUCIÓN
# ========================
if __name__ == "__main__":
    print("🚀 Iniciando carga de colaboradores...")
    cargar_colaboradores_desde_excel()
    print("✨ Proceso finalizado")
