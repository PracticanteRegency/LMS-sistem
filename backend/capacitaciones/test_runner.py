"""
Custom test runner que usa la base de datos real en lugar de crear una de prueba.
Útil para tests de optimización de queries que requieren datos reales.
"""
from django.test.runner import DiscoverRunner


class NoDbTestRunner(DiscoverRunner):
    """Test runner que NO crea base de datos de prueba"""
    
    def setup_databases(self, **kwargs):
        """Override para NO crear BD de prueba"""
        pass
    
    def teardown_databases(self, old_config, **kwargs):
        """Override para NO eliminar BD de prueba"""
        pass
