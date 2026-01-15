from celery import shared_task
from django.core.cache import cache
from django.db.models import Avg
from decimal import Decimal
from datetime import datetime
from calendar import monthrange
from analitica.models import Epresa, Unidadnegocio, Proyecto, Centroop, ProgresoAgregado
from capacitaciones.models import progresoCapacitaciones
from usuarios.models import Colaboradores


@shared_task
def calcular_progreso_empresarial_diario():
    """
    Calcula y guarda los promedios de progreso de empresas, unidades, proyectos y centros.
    Se ejecuta diariamente a las 00:00 para actualizar el modelo desnormalizado.
    """
    try:
        for empresa in Epresa.objects.all():
            unidad_promedios = []
            
            for unidad in empresa.unidadnegocio_set.all():
                proyecto_promedios = []
                
                for proyecto in unidad.proyecto_set.all():
                    # Obtener centros con anotación de promedio en BD
                    centros = Centroop.objects.filter(id_proyecto=proyecto).annotate(
                        promedio_centro=Avg('colaboradores__progresocapacitaciones__progreso')
                    )
                    
                    centro_promedios = []
                    for centro in centros:
                        if centro.promedio_centro is None:
                            continue

                        centro_promedio = float(centro.promedio_centro)
                        
                        # Guardar en modelo desnormalizado
                        ProgresoAgregado.objects.update_or_create(
                            empresa=empresa,
                            unidad=unidad,
                            proyecto=proyecto,
                            centro=centro,
                            mes=None,
                            anio=None,
                            defaults={'promedio_total': Decimal(str(centro_promedio))}
                        )

                        centro_promedios.append(Decimal(centro_promedio or 0))

                    # Calcular promedio del proyecto
                    proyecto_porcentaje = (
                        sum(centro_promedios) / len(centro_promedios)
                        if centro_promedios else 0
                    )
                    
                    # Guardar proyecto en desnormalizado
                    ProgresoAgregado.objects.update_or_create(
                        empresa=empresa,
                        unidad=unidad,
                        proyecto=proyecto,
                        centro=None,
                        mes=None,
                        anio=None,
                        defaults={'promedio_total': Decimal(str(proyecto_porcentaje))}
                    )
                    
                    proyecto_promedios.append(Decimal(proyecto_porcentaje))

                # Calcular promedio de la unidad
                unidad_porcentaje = (
                    sum(proyecto_promedios) / len(proyecto_promedios)
                    if proyecto_promedios else 0
                )
                
                # Guardar unidad en desnormalizado
                ProgresoAgregado.objects.update_or_create(
                    empresa=empresa,
                    unidad=unidad,
                    proyecto=None,
                    centro=None,
                    mes=None,
                    anio=None,
                    defaults={'promedio_total': Decimal(str(unidad_porcentaje))}
                )
                
                unidad_promedios.append(Decimal(unidad_porcentaje))

            # Calcular promedio de la empresa
            empresa_porcentaje = (
                sum(unidad_promedios) / len(unidad_promedios)
                if unidad_promedios else 0
            )
            
            # Guardar empresa en desnormalizado
            ProgresoAgregado.objects.update_or_create(
                empresa=empresa,
                unidad=None,
                proyecto=None,
                centro=None,
                mes=None,
                anio=None,
                defaults={'promedio_total': Decimal(str(empresa_porcentaje))}
            )

        # Invalidar el caché después de actualizar
        cache.delete('progreso_empresarial')
        
        return {
            'status': 'success',
            'message': 'Progreso empresarial calculado y guardado correctamente',
            'registros': ProgresoAgregado.objects.count()
        }
    
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Error al calcular progreso: {str(e)}'
        }


@shared_task
def calcular_progreso_empresarial_mensual(mes=None, anio=None):
    """
    Calcula y guarda los promedios de progreso filtrados por mes y año.
    Si no se especifica mes/año, calcula para el mes actual.
    """
    try:
        # Si no se especifica, usar mes y año actual
        if mes is None or anio is None:
            now = datetime.now()
            mes = now.month
            anio = now.year
        
        # Rango del mes
        inicio_mes = datetime(anio, mes, 1)
        ultimo_dia = monthrange(anio, mes)[1]
        fin_mes = datetime(anio, mes, ultimo_dia, 23, 59, 59)
        
        registros_creados = 0
        
        for empresa in Epresa.objects.all():
            unidad_promedios = []
            
            for unidad in empresa.unidadnegocio_set.all():
                proyecto_promedios = []
                
                for proyecto in unidad.proyecto_set.all():
                    centros = Centroop.objects.filter(id_proyecto=proyecto)
                    centro_promedios = []
                    
                    for centro in centros:
                        # Usar agregación a nivel de base de datos con filtro por fecha
                        promedio_result = Colaboradores.objects.filter(
                            centroOP=centro,
                            progresocapacitaciones__capacitacion__fecha_inicio__lte=fin_mes,
                            progresocapacitaciones__capacitacion__fecha_fin__gte=inicio_mes
                        ).aggregate(
                            promedio_centro=Avg('progresocapacitaciones__progreso')
                        )
                        
                        centro_porcentaje = promedio_result['promedio_centro'] or Decimal('0')
                        
                        # Guardar en ProgresoAgregado con mes/año
                        ProgresoAgregado.objects.update_or_create(
                            empresa=empresa,
                            unidad=unidad,
                            proyecto=proyecto,
                            centro=centro,
                            mes=mes,
                            anio=anio,
                            defaults={'promedio_total': centro_porcentaje}
                        )
                        
                        centro_promedios.append(centro_porcentaje)
                        registros_creados += 1
                    
                    # Calcular promedio del proyecto
                    proyecto_porcentaje = (
                        sum(centro_promedios) / len(centro_promedios)
                        if centro_promedios else Decimal('0')
                    )
                    
                    # Guardar proyecto
                    ProgresoAgregado.objects.update_or_create(
                        empresa=empresa,
                        unidad=unidad,
                        proyecto=proyecto,
                        centro=None,
                        mes=mes,
                        anio=anio,
                        defaults={'promedio_total': proyecto_porcentaje}
                    )
                    
                    proyecto_promedios.append(proyecto_porcentaje)
                    registros_creados += 1
                
                # Calcular promedio de la unidad
                unidad_porcentaje = (
                    sum(proyecto_promedios) / len(proyecto_promedios)
                    if proyecto_promedios else Decimal('0')
                )
                
                # Guardar unidad
                ProgresoAgregado.objects.update_or_create(
                    empresa=empresa,
                    unidad=unidad,
                    proyecto=None,
                    centro=None,
                    mes=mes,
                    anio=anio,
                    defaults={'promedio_total': unidad_porcentaje}
                )
                
                unidad_promedios.append(unidad_porcentaje)
                registros_creados += 1
            
            # Calcular promedio de la empresa
            empresa_porcentaje = (
                sum(unidad_promedios) / len(unidad_promedios)
                if unidad_promedios else Decimal('0')
            )
            
            # Guardar empresa
            ProgresoAgregado.objects.update_or_create(
                empresa=empresa,
                unidad=None,
                proyecto=None,
                centro=None,
                mes=mes,
                anio=anio,
                defaults={'promedio_total': empresa_porcentaje}
            )
            registros_creados += 1
        
        # Invalidar el caché para este mes/año
        cache_key = f'progreso_empresarial_mes_{anio}_{mes}'
        cache.delete(cache_key)
        
        return {
            'status': 'success',
            'message': f'Progreso mensual calculado para {mes}/{anio}',
            'registros_creados': registros_creados,
            'mes': mes,
            'anio': anio
        }
    
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Error al calcular progreso mensual: {str(e)}'
        }
