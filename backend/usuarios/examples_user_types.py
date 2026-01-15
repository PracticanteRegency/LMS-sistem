"""
Guía y ejemplos de cómo usar los nuevos tipos de usuario (Staff levels).

Sistema de permisos:
- Staff = 0: Usuario Normal (sin permisos administrativos)
- Staff = 1: Administrador (acceso completo a todo)
- Staff = 2: Usuario con Lectura Admin (puede hacer GETs como admin, pero no POST/PUT/DELETE)
- Staff = 3: Usuario Especial (tipo de usuario personalizado)
"""

# ============================================================================
# EJEMPLO 1: Crear un nuevo usuario con un tipo específico
# ============================================================================

from usuarios.models import Usuarios, Colaboradores
from django.contrib.auth.hashers import make_password
from django.db import transaction

def crear_usuario_lectura_admin():
    """
    Crea un usuario que puede hacer GETs administrativos 
    pero no puede crear/editar/eliminar (Staff = 2)
    """
    with transaction.atomic():
        # Primero crear o obtener un colaborador
        colaborador = Colaboradores.objects.create(
            cc_colaborador='123456789',
            nombre_colaborador='Juan',
            apellido_colaborador='Pérez',
            cargo_colaborador_id=1,
            correo_colaborador='juan@example.com',
            telefo_colaborador='3001234567'
        )
        
        # Crear usuario con tipo Staff = 2
        usuario = Usuarios.objects.create(
            usuario='juan_lectura',
            password=make_password('mi_contraseña_segura'),
            id_colaboradoru=colaborador,
            is_staff=2,  # Staff = 2 (Lectura Admin)
            is_active=True
        )
        
        return usuario


def crear_usuario_especial():
    """
    Crea un usuario especial (Staff = 3)
    Puedes usarlo para roles custom
    """
    with transaction.atomic():
        colaborador = Colaboradores.objects.create(
            cc_colaborador='987654321',
            nombre_colaborador='María',
            apellido_colaborador='García',
            cargo_colaborador_id=1,
            correo_colaborador='maria@example.com',
            telefo_colaborador='3009876543'
        )
        
        usuario = Usuarios.objects.create(
            usuario='maria_especial',
            password=make_password('otra_contraseña'),
            id_colaboradoru=colaborador,
            is_staff=3,  # Staff = 3 (Usuario Especial)
            is_active=True
        )
        
        return usuario


# ============================================================================
# EJEMPLO 2: Usar los métodos de propiedades para verificar el tipo
# ============================================================================

def verificar_tipo_usuario(usuario):
    """
    Ejemplo de cómo verificar el tipo de usuario usando las propiedades
    """
    print(f"Usuario: {usuario.usuario}")
    print(f"¿Es admin? {usuario.es_admin}")  # True solo si Staff = 1
    print(f"¿Es usuario normal? {usuario.es_usuario_normal}")  # True solo si Staff = 0
    print(f"¿Tiene lectura admin? {usuario.es_lectura_admin}")  # True solo si Staff = 2
    print(f"¿Es usuario especial? {usuario.es_usuario_especial}")  # True solo si Staff = 3
    print(f"¿Tiene permisos admin? {usuario.tiene_permisos_admin}")  # True si Staff in [1, 2, 3]


# ============================================================================
# EJEMPLO 3: Usar los permisos personalizados en vistas
# ============================================================================

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from usuarios.permissions import IsAdminOrLecturaAdmin, IsAdminUser
from rest_framework.response import Response
from rest_framework import status


class EmpresaDetailView(APIView):
    """
    Ejemplo de vista que usa permisos personalizados.
    
    - GET: Solo admin (1) y lectura admin (2) pueden ver
    - POST/PUT/DELETE: Solo admin (1) puede
    """
    permission_classes = [IsAuthenticated, IsAdminOrLecturaAdmin]
    
    def get(self, request, empresa_id):
        """GET permitido para Staff 1 y 2"""
        # ... código para obtener empresa
        return Response({"empresa": {}}, status=status.HTTP_200_OK)
    
    def post(self, request):
        """POST solo permitido para Staff 1"""
        # ... código para crear empresa
        return Response({"message": "Empresa creada"}, status=status.HTTP_201_CREATED)
    
    def put(self, request, empresa_id):
        """PUT solo permitido para Staff 1"""
        # ... código para actualizar empresa
        return Response({"message": "Empresa actualizada"}, status=status.HTTP_200_OK)
    
    def delete(self, request, empresa_id):
        """DELETE solo permitido para Staff 1"""
        # ... código para eliminar empresa
        return Response({"message": "Empresa eliminada"}, status=status.HTTP_204_NO_CONTENT)


# ============================================================================
# EJEMPLO 4: Verificar permisos manualmente en una vista
# ============================================================================

def ejemplo_vista_permisos_manuales(request):
    """
    Si prefieres verificar permisos manualmente dentro de una vista
    """
    usuario = request.user
    
    if usuario.es_admin:
        # Usuario es administrador completo
        return Response({"mensaje": "Acceso de admin"})
    
    elif usuario.es_lectura_admin:
        # Usuario puede leer datos admin pero no modificar
        if request.method == 'GET':
            return Response({"mensaje": "Lectura permitida"})
        else:
            return Response(
                {"error": "No puede modificar datos"},
                status=status.HTTP_403_FORBIDDEN
            )
    
    elif usuario.es_usuario_normal:
        # Usuario normal
        return Response({"mensaje": "Usuario normal"})
    
    elif usuario.es_usuario_especial:
        # Usuario especial
        return Response({"mensaje": "Usuario especial"})


# ============================================================================
# EJEMPLO 5: Cambiar el tipo de usuario de un usuario existente
# ============================================================================

def cambiar_tipo_usuario(usuario_id, nuevo_tipo):
    """
    Cambia el tipo de usuario (is_staff).
    
    nuevo_tipo puede ser: 0, 1, 2 o 3
    """
    try:
        usuario = Usuarios.objects.get(id=usuario_id)
        usuario.is_staff = nuevo_tipo
        usuario.save()
        return {"success": True, "message": f"Usuario actualizado a tipo {nuevo_tipo}"}
    except Usuarios.DoesNotExist:
        return {"success": False, "message": "Usuario no encontrado"}


# ============================================================================
# EJEMPLO 6: Listar todos los usuarios por tipo
# ============================================================================

def listar_usuarios_por_tipo():
    """
    Lista todos los usuarios agrupados por tipo
    """
    tipos = {
        0: "Usuarios Normales",
        1: "Administradores",
        2: "Usuarios con Lectura Admin",
        3: "Usuarios Especiales"
    }
    
    resultado = {}
    
    for tipo_id, tipo_nombre in tipos.items():
        usuarios = Usuarios.objects.filter(is_staff=tipo_id)
        resultado[tipo_nombre] = [
            {
                "id": u.id,
                "usuario": u.usuario,
                "colaborador": str(u.id_colaboradoru)
            }
            for u in usuarios
        ]
    
    return resultado


# ============================================================================
# RESUMEN DE PERMISOS POR TIPO
# ============================================================================

"""
┌─────────────────────────────────────────────────────────────────┐
│           TABLA DE PERMISOS POR TIPO DE USUARIO                │
├─────────────────────┬───┬─────┬───────┬────────┬────────┬───────┤
│ Tipo                │GET│POST │ PUT   │DELETE  │ Lectura│Modificar│
├─────────────────────┼───┼─────┼───────┼────────┼────────┼───────┤
│ 0: Usuario Normal   │ ✗ │  ✗  │  ✗    │  ✗     │   ✗    │   ✗    │
│ 1: Administrador    │ ✓ │  ✓  │  ✓    │  ✓     │   ✓    │   ✓    │
│ 2: Lectura Admin    │ ✓ │  ✗  │  ✗    │  ✗     │   ✓    │   ✗    │
│ 3: Usuario Especial │ ? │  ?  │  ?    │  ?     │   ?    │   ?    │
└─────────────────────┴───┴─────┴───────┴────────┴────────┴───────┘

Nota: El tipo 3 (Usuario Especial) puedes configurarlo según tus necesidades.
"""
