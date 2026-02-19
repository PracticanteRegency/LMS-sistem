# 🔄 FLUJOS Y DIAGRAMAS - SISTEMA DE VALIDACIÓN DE CORREOS

---

## 1. FLUJO ACTUAL DE ENVÍO (SIN VALIDACIÓN)

```
┌─────────────────┐
│   Usuario       │
│   Inicia Envío  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Validar entrada básica         │
│  - Lista de emails no vacía     │
│  - Formato de email (regex)     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Conectar a SMTP                │
│  (Sin validación previa)        │
└────────┬────────────────────────┘
         │
    ┌────┴────┐
    │ ¿Éxito? │
    └────┬────┘
         │
    ┌────┴──────────────────┐
    │                       │
   ✓                       ✗
    │                       │
    ▼                       ▼
┌─────────────────┐   ┌──────────────────┐
│ Enviar en       │   │ ERROR!           │
│ lotes de 500    │   │ (Sin manejo)     │
└────────┬────────┘   │ - Log en console │
         │            │ - Return error   │
         ▼            └──────────────────┘
┌─────────────────┐
│ Registrar en    │
│ CorreoExamen    │
│ Enviado         │
└─────────────────┘
```

### Problemas:
- ❌ Sin validación previa de SMTP
- ❌ Sin notificación de errores
- ❌ Sin reintentos automáticos
- ❌ Sin auditoría detallada
- ❌ Sin alertas a admin

---

## 2. FLUJO PROPUESTO (CON VALIDACIÓN)

```
┌─────────────────────────────────────────┐
│  INICIO: Usuario solicita envío         │
└──────────────────┬──────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  FASE 1: PRE-ENVÍO   │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────────────────┐
        │ A. Validar Conectividad SMTP    │
        │    - Test conexión              │
        │    - Verificar credenciales     │
        └──────────┬──────────────────────┘
                   │
              ┌────┴────┐
              │ ¿Ok?    │
              └────┬────┘
                   │
            ┌──────┴──────┐
           ✓             ✗
            │              │
            ▼              ▼
        ┌────┐      ┌──────────────────┐
        │ SÍ │      │ ABORTADO         │
        └────┘      │ - Error SMTP     │
            │       │ - Notificar admin│
            │       └──────────────────┘
            ▼
    ┌────────────────────────────┐
    │ B. Validar Lista de Emails │
    │    - Formato válido        │
    │    - Eliminar duplicados   │
    │    - Filtrar usuarios      │
    │      activos (estado=1)    │
    └──────────┬─────────────────┘
               │
          ┌────┴────┐
          │Emails?  │
          └────┬────┘
               │
        ┌──────┴──────┐
       ✓            ✗
        │              │
        ▼              ▼
    ┌────┐      ┌──────────────┐
    │ SÍ │      │ Sin emails   │
    └────┘      │ válidos      │
        │       └──────────────┘
        │
        ▼
    ┌────────────────────────┐
    │ C. Crear registro de   │
    │    auditoría           │
    │    EnvioCorreoLog      │
    │    - id_envio: UUID    │
    │    - estado: EN_PROCESO│
    │    - timestamp_inicio  │
    └──────────┬─────────────┘
               │
               ▼
    ┌──────────────────────┐
    │  FASE 2: DURANTE     │
    │  ENVÍO POR LOTES     │
    └──────────┬───────────┘
               │
        ┌──────┴────────────────┐
        │ Para cada lote de 500:│
        └──────────┬────────────┘
                   │
        ┌──────────┴───────────────┐
        │ 1. Crear instancia       │
        │    EmailMultiAlternatives│
        │    with BCC              │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ 2. Intentar envío    │
        │    email.send()      │
        └──────────┬───────────┘
                   │
              ┌────┴────┐
              │ ¿Éxito? │
              └────┬────┘
                   │
          ┌────────┴────────┐
         ✓                 ✗
          │                  │
          ▼                  ▼
    ┌───────────┐  ┌──────────────────┐
    │Incrementar│  │Registrar error:  │
    │enviados   │  │- ErrorEnvioCorreo│
    │+= 500     │  │- código_error    │
    └───────────┘  │- mensaje         │
                   │- email afectado  │
                   └──────────────────┘
                           │
                           ▼
                   ┌──────────────────┐
                   │Incrementar       │
                   │fallidos += 500   │
                   └──────────────────┘
                   │
        ┌──────────┴─────────────┐
        │ ¿Más lotes?            │
        └──────────┬─────────────┘
                   │
          ┌────────┴────────┐
         ✓                 ✗
          │                  │
          ▼                  ▼
    ┌─────────────┐   ┌────────────────┐
    │ Esperar 2s  │   │FASE 3: POST-   │
    │ (rate limit)│   │ENVÍO           │
    └──────────┬──┘   └────────┬───────┘
               │                │
               └────────┬───────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ Actualizar registro   │
            │ EnvioCorreoLog:       │
            │ - enviados            │
            │ - fallidos            │
            │ - duracion_segundos   │
            │ - estado: COMPLETADO  │
            │ - fecha_fin           │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ Calcular estadísticas │
            │ - tasa_exito          │
            │ - duracion_formateada │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ FASE 4: ALERTAS       │
            └───────────┬───────────┘
                        │
              ┌─────────┴──────────────┐
              │                        │
        ¿Fallidos > 0?            ¿Tasa < 80%?
              │                        │
          ┌───┴───┐              ┌─────┴─────┐
         ✓       ✗              ✓           ✗
          │       │              │           │
          ▼       │              ▼           │
    ┌──────────────┐      ┌────────────────┐ │
    │Notificar     │      │Notificar admin:│ │
    │admin:        │      │- Tasa baja     │ │
    │- Fallos      │      │- Investigar    │ │
    │- Emails      │      └────────────────┘ │
    │- Códigos     │                         │
    └──────┬───────┘                         │
           │                                 │
           └─────────────┬───────────────────┘
                         │
                         ▼
            ┌─────────────────────────┐
            │ FASE 5: AUDITORÍA       │
            │ - Guardar logs          │
            │ - Crear ID_ENVIO único  │
            │ - Registrar todos los   │
            │   detalles              │
            └─────────────┬───────────┘
                          │
                          ▼
            ┌─────────────────────────┐
            │ REINTENTOS (si falla)   │
            │ - Programar reintento   │
            │ - esperar 1 hora        │
            │ - max 3 intentos        │
            └─────────────┬───────────┘
                          │
                          ▼
                   ┌────────────┐
                   │    FIN     │
                   └────────────┘
```

---

## 3. VALIDACIÓN DE EMAIL - FLUJO DETALLADO

```
┌──────────────────────────┐
│ Email recibido           │
│ ej: user@example.com     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 1. Validar Formato       │
│    Patrón regex:         │
│    ^[a-zA-Z0-9._%+-]+@   │
│    [a-zA-Z0-9.-]+\.      │
│    [a-zA-Z]{2,}$         │
└──────────┬───────────────┘
           │
      ┌────┴────┐
      │ ¿Válido?│
      └────┬────┘
           │
    ┌──────┴──────┐
   ✓            ✗
    │              │
    ▼              ▼
┌────────┐    ┌────────────────────┐
│Continuar│   │ RECHAZADO          │
└────┬───┘    │ - Marcar como      │
     │        │   email_invalidos  │
     │        │ - Log en sistemas  │
     │        │ - No enviar        │
     │        └────────────────────┘
     │
     ▼
┌──────────────────────────┐
│ 2. Verificar Usuario     │
│    Query:                │
│    Usuarios.objects      │
│    .filter(              │
│      correo=email,       │
│      estado=1            │
│    ).exists()            │
└──────────┬───────────────┘
           │
      ┌────┴────┐
      │¿Existe? │
      └────┬────┘
           │
    ┌──────┴──────┐
   ✓            ✗
    │              │
    ▼              ▼
┌──────────┐   ┌──────────────────┐
│Agregar a │   │OMITIDO           │
│lote para │   │- Usuario inactivo│
│enviar    │   │- No encontrado   │
└──────────┘   │- Registrar omisión
               └──────────────────┘
```

---

## 4. MODELO DE DATOS - RELACIONES

```
┌──────────────────────────────────────────┐
│        EnvioCorreoLog (Auditoría)        │
├──────────────────────────────────────────┤
│ PK: id                                   │
│ id_envio: UUID (único)                   │
│ modulo: str (examenes|capacitaciones)    │
│ tipo_envio: str (individual|lote|masivo) │
│ destinatarios_total: int                 │
│ destinatarios_exitosos: int              │
│ destinatarios_fallidos: int              │
│ asunto: str                              │
│ estado: str (pendiente|en_proceso|...)   │
│ mensaje_error: text (si aplica)          │
│ fecha_inicio: DateTime                   │
│ fecha_fin: DateTime (NULL si en proceso) │
│ duracion_segundos: int                   │
│ intentos: int (para reintentos)          │
│ proximo_reintento: DateTime              │
│ usuario_origen: FK → Usuarios            │
└──────┬───────────────────────────────────┘
       │
       │ 1:N
       │
       ▼
┌──────────────────────────────────────┐
│    ErrorEnvioCorreo (Detalles)       │
├──────────────────────────────────────┤
│ PK: id                               │
│ FK: envio_log → EnvioCorreoLog       │
│ email_destinatario: EmailField       │
│ codigo_error: str (SMTP_AUTH_ERROR)  │
│ mensaje_error: text                  │
│ timestamp: DateTime                  │
└──────────────────────────────────────┘
```

---

## 5. MANEJADOR DE ERRORES - ÁRBOL DE DECISIÓN

```
                    ┌─────────────────┐
                    │ Error detectado │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │ ¿Tipo de error? │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌──────────┐       ┌──────────┐        ┌──────────┐
    │AUTENT.   │       │ CONEXIÓN │        │ SMTP     │
    │ERROR     │       │ ERROR    │        │ ERROR    │
    └────┬─────┘       └────┬─────┘        └────┬─────┘
         │                  │                    │
         ▼                  ▼                    ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │Verificar     │  │Verificar     │  │Verificar     │
    │credenciales  │  │host/puerto   │  │limite SMTP   │
    │en .env       │  │              │  │             │
    └────┬─────────┘  └────┬─────────┘  └────┬─────────┘
         │                  │                  │
         ▼                  ▼                  ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │Reintentar    │  │Reintentar    │  │Dividir en    │
    │en 1 hora     │  │en 30 min     │  │más lotes     │
    │max 3 veces   │  │max 5 veces   │  │(250 en lugar │
    │              │  │              │  │de 500)       │
    └────┬─────────┘  └────┬─────────┘  └────┬─────────┘
         │                  │                  │
         └──────────┬───────┴──────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │¿Intentos agotados?   │
         └────────┬─────────────┘
                  │
          ┌───────┴────────┐
         ✓                ✗
          │                 │
          ▼                 ▼
    ┌──────────┐      ┌──────────┐
    │FALLAR    │      │REINTENTO │
    │NOTIFICAR │      │AGENDADO  │
    │ADMIN     │      └──────────┘
    └──────────┘
```

---

## 6. CICLO DE REINTENTOS

```
INTENTO 1
┌──────────────────────────────────┐
│ Enviar lote                      │
│ Registrar intent #1              │
└──────────┬───────────────────────┘
           │
      ┌────┴────┐
      │¿Éxito?  │
      └────┬────┘
           │
    ┌──────┴──────┐
   ✓             ✗
    │              │
    ▼              ▼
  FIN        ┌──────────────┐
             │FALLÓ         │
             │Programar     │
             │reintento en: │
             │+1 hora       │
             └──────┬───────┘
                    │
                    ▼
          ESPERA: 1 HORA
          ┌──────────────┐
          │Celery Beat   │
          │ejecuta task  │
          │en 1 hora     │
          └──────┬───────┘
                 │
INTENTO 2
┌──────────────────────────────────┐
│ Reintento automático             │
│ Registrar intento #2             │
└──────────┬───────────────────────┘
           │
      ┌────┴────┐
      │¿Éxito?  │
      └────┬────┘
           │
    ┌──────┴──────┐
   ✓             ✗
    │              │
    ▼              ▼
  FIN        ┌──────────────┐
             │FALLÓ         │
             │Programar     │
             │reintento en: │
             │+1 hora       │
             └──────┬───────┘
                    │
                    ▼
          ESPERA: 1 HORA
          
INTENTO 3
┌──────────────────────────────────┐
│ Reintento automático (último)    │
│ Registrar intento #3             │
└──────────┬───────────────────────┘
           │
      ┌────┴────┐
      │¿Éxito?  │
      └────┬────┘
           │
    ┌──────┴──────┐
   ✓             ✗
    │              │
    ▼              ▼
  FIN       ┌──────────────┐
            │FALLÓ (final) │
            │Notificar     │
            │administrador │
            │correo crítico│
            └──────────────┘
```

---

## 7. ARQUITECTURA DE NOTIFICACIÓN

```
                    ┌──────────────────┐
                    │ Error Crítico    │
                    │ (3 intentos fail)│
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌──────────┐       ┌──────────┐      ┌──────────┐
    │ EMAIL    │       │ WEBHOOK  │      │ DATABASE │
    │ ADMIN    │       │ SLACK/   │      │ LOG      │
    │          │       │ DISCORD  │      │          │
    └────┬─────┘       └────┬─────┘      └────┬─────┘
         │                  │                  │
         ▼                  ▼                  ▼
    ┌───────────┐       ┌──────────┐      ┌──────────┐
    │send_mail  │       │requests. │      │models.   │
    │           │       │post()    │      │save()    │
    │correo@    │       │https://  │      │          │
    │admin.com  │       │hooks...  │      │Estado    │
    │           │       │          │      │fallido   │
    └───────────┘       └──────────┘      └──────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ Admin notificado │
                   │ en todos los     │
                   │ canales          │
                   └──────────────────┘
```

---

## 8. DASHBOARD DE MONITOREO

```
╔═══════════════════════════════════════════════════════════════╗
║             📊 EMAIL MONITORING DASHBOARD                    ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║ ESTADO SMTP                                    CONECTADO ✅  ║
║ ├─ Host: smtp.gmail.com                                      ║
║ ├─ Puerto: 465 (SSL)                                         ║
║ ├─ Usuario: admin@regencysa.net                              ║
║ └─ Última verificación: hace 2 minutos                       ║
║                                                               ║
║─────────────────────────────────────────────────────────────║
║                                                               ║
║ ESTADÍSTICAS (Últimos 7 días)                                ║
║ ├─ Total de envíos: 245                                      ║
║ ├─ Exitosos: 238 (97.1%)                  ✅ BUENO           ║
║ ├─ Fallidos: 7 (2.9%)                     ⚠️ REVISAR          ║
║ └─ En reintento: 2                        🔄 PENDIENTE        ║
║                                                               ║
║─────────────────────────────────────────────────────────────║
║                                                               ║
║ POR MÓDULO                                                   ║
║ ├─ Capacitaciones: 150 exitosos / 3 fallidos                ║
║ ├─ Exámenes: 75 exitosos / 2 fallidos                       ║
║ └─ Notificaciones: 13 exitosos / 2 fallidos                 ║
║                                                               ║
║─────────────────────────────────────────────────────────────║
║                                                               ║
║ ÚLTIMOS ERRORES                                              ║
║ ┌───────────────────────────────────────────────────────────┐║
║ │ ID: 550e8400-e29b-41d4-a716...                            ││
║ │ Módulo: Capacitaciones                                    ││
║ │ Estado: Fallido (completado parcial)                      ││
║ │ Enviados: 245/250 (98%)                                   ││
║ │ Error: SMTP 452 Too many connections                      ││
║ │ Reintento próximo: en 1 hora                              ││
║ │ [Ver detalles] [Reintentar ahora]                         ││
║ └───────────────────────────────────────────────────────────┘║
║                                                               ║
║─────────────────────────────────────────────────────────────║
║                                                             ║
║ ALERTAS ACTIVAS                                             ║
║ ├─ ⚠️  2 envíos en reintento (esperando 45 min)            ║
║ ├─ ⚠️  Tasa de éxito baja (97.1% vs objetivo 99%)           ║
║ └─ ℹ️  Próxima verificación SMTP: 23:45                     ║
║                                                              ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 9. TIMELINE DE IMPLEMENTACIÓN

```
SEMANA 1
┌──────────────────────────────────────┐
│ DÍA 1-2: Crear modelos               │
│ ├─ EnvioCorreoLog                    │
│ ├─ ErrorEnvioCorreo                  │
│ ├─ Migraciones                       │
│ └─ Admin registration                │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ DÍA 3-4: Crear utilidades            │
│ ├─ email_validation.py               │
│ ├─ Decorador registrar_envio         │
│ ├─ Funciones de validación           │
│ └─ Notificador de errores            │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ DÍA 5: Crear vistas                  │
│ ├─ EmailDashboardView                │
│ ├─ EmailStatusView                   │
│ └─ Serializers                       │
└──────────────────────────────────────┘

SEMANA 2
┌──────────────────────────────────────┐
│ DÍA 6-7: Integración Módulo 1        │
│ ├─ Integración en capacitaciones     │
│ ├─ Pruebas con 1500+ emails          │
│ └─ Verificación SMTP                 │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ DÍA 8: Integración Módulo 2          │
│ ├─ Integración en exámenes           │
│ ├─ Tests                             │
│ └─ Verificación                      │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ DÍA 9-10: Integración Módulo 3       │
│ ├─ Integración en notificaciones     │
│ ├─ Tasks Celery                      │
│ └─ Celery Beat setup                 │
└──────────────────────────────────────┘

SEMANA 3
┌──────────────────────────────────────┐
│ DÍA 11-14: Testing y QA              │
│ ├─ Tests unitarios                   │
│ ├─ Tests integración                 │
│ ├─ Tests stress (1500+ emails)       │
│ └─ Testing en staging                │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ DÍA 15: Deployment                   │
│ ├─ Migraciones en prod               │
│ ├─ Deploy en prod                    │
│ ├─ Monitoreo                         │
│ └─ Documentación                     │
└──────────────────────────────────────┘
```

---

## 10. MÉTRICAS DE ÉXITO

```
┌─────────────────────────────────────────────┐
│ MÉTRICA                   META      ACTUAL  │
├─────────────────────────────────────────────┤
│ Tasa de éxito             > 99%     97.1%   │
│ Tiempo detección error    < 5 min   3 min   │
│ Tiempo resolución         < 1 hora  45 min  │
│ Downtime correos/mes      < 5 min   12 min  │
│ Emails recuperados        > 98%     95%     │
│ Admin alertado            Sí        Sí      │
│ Documentación              100%      80%     │
└─────────────────────────────────────────────┘

GRÁFICO DE TASA DE ÉXITO

100% ┤
     ┤     ┌─────────────────────────────
 99% ┤    /  META: > 99%
     ┤   /
 98% ┼──/────────────────────────────────
     ┤ /
 97% ┤/      ACTUAL: 97.1%
     ┤────────────────────────────────────
  D1  D2  D3  D4  D5  D6  D7  D8  D9  D10
```

---

**Documento generado:** 2026-02-17
**Versión:** 1.0
**Diagramas:** ASCII Art
**Listo para:** Implementación progresiva
