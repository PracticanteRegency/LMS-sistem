"""
Permisos personalizados para los diferentes tipos de usuario.
Permiten un control granular de acceso según tipousuario.

Tipos de Usuario (tipousuario):
- 0: Usuario Normal/Colaborador
- 1: Administrador
- 2: Lectura Admin  
- 3: Usuario Especial
- 4: Super Admin
"""
from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """
    Permite el acceso solo a administradores (tipousuario == 1).
    Estos usuarios pueden hacer CUALQUIER cosa: GET, POST, PUT, DELETE.
    Super Admin (tipousuario == 4) siempre tiene acceso.
    """
    message = "Solo administradores pueden acceder a este recurso."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Super Admin siempre tiene acceso
        if getattr(request.user, 'tipousuario', None) == 4:
            return True
        return getattr(request.user, 'tipousuario', None) == 1


class IsLecturaAdmin(BasePermission):
    """
    Permite GET (lectura) a usuarios tipousuario == 2.
    Usuario normal con permisos de lectura administrativa.
    Admin (1) y Super Admin (4) también tienen acceso completo.
    """
    message = "No tiene permiso para realizar esta acción."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        tipo = getattr(request.user, 'tipousuario', None)
        
        # Super Admin tiene acceso total
        if tipo == 4:
            return True
        
        # Admin (1) y Lectura Admin (2) pueden hacer GET
        if request.method == 'GET':
            return tipo in [1, 2]
        
        # Solo Admin (1) puede hacer POST, PUT, DELETE
        return tipo == 1


class IsUsuarioEspecial(BasePermission):
    """
    Permite el acceso a usuarios tipousuario == 3.
    Define permisos para este tipo especial de usuario.
    Super Admin también tiene acceso.
    """
    message = "Este usuario no tiene permisos suficientes."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        tipo = getattr(request.user, 'tipousuario', None)
        if tipo == 4:  # Super Admin
            return True
        return tipo == 3


class IsAdminOrLecturaAdmin(BasePermission):
    """
    Permite acceso a Admin (1) y Lectura Admin (2).
    GET: ambos pueden (1, 2, 4)
    POST, PUT, DELETE: solo admin (1, 4)
    """
    message = "No tiene permiso para realizar esta acción."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        tipo = getattr(request.user, 'tipousuario', None)
        
        # Super Admin tiene acceso total
        if tipo == 4:
            return True
        
        # GET: Admin y Lectura Admin
        if request.method == 'GET':
            return tipo in [1, 2]
        
        # POST, PUT, DELETE: Solo Admin
        return tipo == 1


class IsNormalUserOrAdmin(BasePermission):
    """
    Permite acceso a usuarios normales (0) y administradores (1, 4).
    Todos los usuarios autenticados pueden acceder.
    """
    message = "No tiene permiso para acceder a este recurso."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        tipo = getattr(request.user, 'tipousuario', None)
        # Super Admin, Admin y Usuarios Normales
        return tipo in [0, 1, 4]


class IsSuperUserOrAdmin(BasePermission):
    """
    Permite acceso solo a super admin (4) o administradores (1).
    """
    message = "Solo administradores pueden acceder a este recurso."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        tipo = getattr(request.user, 'tipousuario', None)
        return tipo in [1, 4]


class IsAuthenticatedUser(BasePermission):
    """
    Permite acceso a cualquier usuario autenticado.
    """
    message = "Debe estar autenticado para acceder a este recurso."

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsSuperAdmin(BasePermission):
    """
    Permite acceso solo a super administradores (tipousuario == 4).
    """
    message = "Solo super administradores pueden acceder a este recurso."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'tipousuario', None) == 4
