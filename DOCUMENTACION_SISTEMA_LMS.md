# DOCUMENTACIÓN COMPLETA DEL SISTEMA LMS — MIConocimiento

**Plataforma de Gestión de Aprendizaje (Learning Management System)**  
**Versión:** 3.0  
**Fecha:** 24 de marzo de 2026  
**Última Actualización:** 24 de marzo de 2026
**Empresa:** Grupo Empresarial Regency S.A.S.

---

## ÍNDICE GENERAL

- [DOCUMENTOS RELACIONADOS](#documentos-relacionados)
- [CAPÍTULO I — INFORMACIÓN GENERAL](#capítulo-i--información-general)
  - [1. Objetivo del Sistema](#1-objetivo-del-sistema)
  - [2. Alcance](#2-alcance)
  - [3. Definiciones y Glosario](#3-definiciones-y-glosario)
  - [4. Arquitectura del Sistema](#4-arquitectura-del-sistema)
  - [5. Roles y Niveles de Acceso](#5-roles-y-niveles-de-acceso)
- [CAPÍTULO II — ACCESO AL SISTEMA](#capítulo-ii--acceso-al-sistema)
  - [6. Inicio de Sesión](#6-inicio-de-sesión)
  - [7. Cierre de Sesión](#7-cierre-de-sesión)
  - [8. Página No Autorizado](#8-página-no-autorizado)
- [CAPÍTULO III — MÓDULO DE NAVEGACIÓN](#capítulo-iii--módulo-de-navegación)
  - [9. Barra de Navegación Superior (Navbar)](#9-barra-de-navegación-superior-navbar)
  - [10. Menú Lateral (Sidebar)](#10-menú-lateral-sidebar)
- [CAPÍTULO IV — MÓDULO MIS CAPACITACIONES (HOME)](#capítulo-iv--módulo-mis-capacitaciones-home)
  - [11. Vista General de Mis Capacitaciones](#11-vista-general-de-mis-capacitaciones)
  - [12. Tarjeta de Capacitación](#12-tarjeta-de-capacitación)
- [CAPÍTULO V — MÓDULO DE PERFIL DE USUARIO](#capítulo-v--módulo-de-perfil-de-usuario)
  - [13. Vista del Perfil](#13-vista-del-perfil)
  - [14. Pestaña Capacitaciones](#14-pestaña-capacitaciones)
  - [15. Pestaña Certificados](#15-pestaña-certificados)
  - [16. Pestaña Información](#16-pestaña-información)
- [CAPÍTULO VI — MÓDULO VER CAPACITACIÓN](#capítulo-vi--módulo-ver-capacitación)
  - [17. Detalle de Capacitación](#17-detalle-de-capacitación)
  - [18. Módulos y Lecciones](#18-módulos-y-lecciones)
  - [19. Reproductor de Video](#19-reproductor-de-video)
  - [20. Visor de Imágenes y PDF](#20-visor-de-imágenes-y-pdf)
  - [21. Formulario de Evaluación (Responder Lección)](#21-formulario-de-evaluación-responder-lección)
- [CAPÍTULO VII — MÓDULO ANALÍTICA (DASHBOARD)](#capítulo-vii--módulo-analítica-dashboard)
  - [22. Panel de Analíticas](#22-panel-de-analíticas)
  - [23. KPIs Principales](#23-kpis-principales)
  - [24. Estructura Organizacional Interactiva](#24-estructura-organizacional-interactiva)
- [CAPÍTULO VIII — MÓDULO GESTIÓN DE CAPACITACIONES (ADMIN)](#capítulo-viii--módulo-gestión-de-capacitaciones-admin)
  - [25. Listado de Capacitaciones](#25-listado-de-capacitaciones)
  - [26. Crear / Editar Capacitación](#26-crear--editar-capacitación)
  - [27. Gestión de Módulos y Lecciones](#27-gestión-de-módulos-y-lecciones)
  - [28. Gestión de Preguntas y Respuestas (Formularios)](#28-gestión-de-preguntas-y-respuestas-formularios)
  - [29. Asignación de Colaboradores](#29-asignación-de-colaboradores)
  - [30. Editar Colaboradores de una Capacitación](#30-editar-colaboradores-de-una-capacitación)
  - [31. Usuarios de una Capacitación (Progreso)](#31-usuarios-de-una-capacitación-progreso)
  - [32. Perfil de Usuario en Capacitación (Admin)](#32-perfil-de-usuario-en-capacitación-admin)
  - [33. Generación de Reportes de Capacitaciones](#33-generación-de-reportes-de-capacitaciones)
- [CAPÍTULO IX — MÓDULO GESTIÓN DE USUARIOS](#capítulo-ix--módulo-gestión-de-usuarios)
  - [34. Listado de Usuarios](#34-listado-de-usuarios)
  - [35. Crear Usuario](#35-crear-usuario)
  - [36. Editar Usuario](#36-editar-usuario)
  - [37. Cambiar Estado de Usuario](#37-cambiar-estado-de-usuario)
  - [38. Cambiar Rol de Usuario](#38-cambiar-rol-de-usuario)
- [CAPÍTULO X — MÓDULO DE EXÁMENES](#capítulo-x--módulo-de-exámenes)
  - [39. Crear Examen](#39-crear-examen)
  - [40. Editar Asignaciones de Exámenes](#40-editar-asignaciones-de-exámenes)
  - [41. Enviar Exámenes por Correo](#41-enviar-exámenes-por-correo)
  - [42. Envío Masivo de Exámenes (CSV)](#42-envío-masivo-de-exámenes-csv)
- [CAPÍTULO XI — MÓDULO REPORTES DE CORREOS](#capítulo-xi--módulo-reportes-de-correos)
  - [43. Listado de Reportes de Correos](#43-listado-de-reportes-de-correos)
  - [44. Detalle de Correo Enviado](#44-detalle-de-correo-enviado)
  - [45. Trabajadores por Correo](#45-trabajadores-por-correo)
  - [46. Generación de Reporte Excel](#46-generación-de-reporte-excel)
  - [47. Filtro por Colaborador y Búsqueda por UUID](#47-filtro-por-colaborador-y-búsqueda-por-uuid)
- [CAPÍTULO XII — MÓDULO GESTIÓN EMPRESARIAL](#capítulo-xii--módulo-gestión-empresarial)
  - [48. Datos de Empresa](#48-datos-de-empresa)
  - [49. Gestión de Unidades](#49-gestión-de-unidades)
  - [50. Gestión de Proyectos](#50-gestión-de-proyectos)
  - [51. Gestión de Centros Operativos](#51-gestión-de-centros-operativos)
  - [52. Asignación de Jefes de Proyecto](#52-asignación-de-jefes-de-proyecto)
  - [53. Cargo, Nivel y Regional](#53-cargo-nivel-y-regional)
- [CAPÍTULO XII-B — MÓDULO MICampeonato (MUNDIAL)](#capítulo-xii-b--módulo-micampeonato-mundial)
  - [54. Descripción General del Módulo](#54-descripción-general-del-módulo)
  - [55. Ediciones del Mundial](#55-ediciones-del-mundial)
  - [56. Gestión de Equipos](#56-gestión-de-equipos)
  - [57. Gestión de Partidos](#57-gestión-de-partidos)
  - [58. Sistema de Predicciones de Partidos](#58-sistema-de-predicciones-de-partidos)
  - [59. Predicciones Especiales](#59-predicciones-especiales)
  - [60. Sistema de Puntuación](#60-sistema-de-puntuación)
  - [61. Rankings](#61-rankings)
  - [62. Panel de Administración del Mundial](#62-panel-de-administración-del-mundial)
  - [63. Configuración del Torneo](#63-configuración-del-torneo)
- [CAPÍTULO XIII — CASOS DE USO](#capítulo-xiii--casos-de-uso)
  - [CU-01: Inicio de Sesión](#cu-01-inicio-de-sesión)
  - [CU-02: Ver Mis Capacitaciones](#cu-02-ver-mis-capacitaciones)
  - [CU-03: Completar Lección de Video](#cu-03-completar-una-lección-de-video)
  - [CU-04: Responder Formulario](#cu-04-responder-formulario-de-evaluación)
  - [CU-05: Crear Capacitación](#cu-05-crear-una-capacitación)
  - [CU-06: Gestionar Usuarios](#cu-06-gestionar-usuarios)
  - [CU-07: Crear y Enviar Exámenes](#cu-07-crear-y-enviar-exámenes)
  - [CU-08: Consultar Analíticas](#cu-08-consultar-analíticas)
  - [CU-09: Gestionar Estructura Empresarial](#cu-09-gestionar-estructura-empresarial)
  - [CU-10: Gestionar Datos Maestros](#cu-10-gestionar-cargos-niveles-y-regionales)
  - [CU-11: Generar Reportes](#cu-11-generar-reportes)
  - [CU-12: Ver Perfil del Colaborador](#cu-12-ver-perfil-del-colaborador-admin)
  - [CU-13: Editar Capacitación](#cu-13-editar-capacitación-existente)
  - [CU-14: Eliminar Capacitación](#cu-14-eliminar-capacitación)
  - [CU-15: Cambiar Estado de Capacitación](#cu-15-cambiar-estado-de-capacitación-activardesactivar)
  - [CU-16: Descargar Certificado](#cu-16-descargar-certificado)
  - [CU-17: Consultar Historial de Exámenes](#cu-17-consultar-historial-de-exámenes)
  - [CU-18: Buscar Capacitación](#cu-18-buscar-capacitación)
  - [CU-19: Ver Progreso de Capacitaciones](#cu-19-ver-progreso-de-capacitaciones)
  - [CU-20: Realizar Predicción de Partido](#cu-20-realizar-predicción-de-partido)
  - [CU-21: Realizar Predicción Especial](#cu-21-realizar-predicción-especial)
  - [CU-22: Consultar Rankings del Mundial](#cu-22-consultar-rankings-del-mundial)
  - [CU-23: Administrar Partidos y Resultados](#cu-23-administrar-partidos-y-resultados)
  - [CU-24: Configurar Torneo](#cu-24-configurar-torneo)
- [CAPÍTULO XIV — CONVENCIONES E ÍCONOS](#capítulo-xiv--convenciones-e-íconos)
- [CAPÍTULO XV — CONTROL DE CAMBIOS](#capítulo-xv--control-de-cambios)

---

## DOCUMENTOS RELACIONADOS

Este documento es parte de una serie de documentación técnica y funcional del sistema LMS MIConocimiento. Se recomienda revisar los siguientes documentos complementarios:

| Documento | Descripción | Ubicación |
|---|---|---|
| **MATRIZ_CASOS_USO_Y_ROLES.md** | Matriz completa de acceso a funcionalidades por rol. Incluye tablas de restricciones, permisos y flujos de navegación. | Carpeta principal |
| **ESPECIFICACIONES_TECNICAS_CASOS_USO.md** | Especificaciones técnicas detalladas: endpoints, validaciones, flujos, componentes frontend y backend. | Carpeta principal |
| **DOCUMENTACION_SISTEMA_LMS.md** | Este documento. Referencia funcional completa con 24 casos de uso detallados. | Carpeta principal |

> **Recomendación de lectura:** Iniciar por este documento para comprender funcionalidades, luego consultar la matriz de roles para entender permisos y accesos, y finalmente revisar especificaciones técnicas para detalles de implementación.

---

## CAPÍTULO I — INFORMACIÓN GENERAL

### 1. Objetivo del Sistema

El sistema **MIConocimiento** es una plataforma de gestión de aprendizaje (LMS) diseñada para administrar, distribuir y dar seguimiento a las capacitaciones, evaluaciones y exámenes ocupacionales de los colaboradores del Grupo Empresarial Regency S.A.S. y sus empresas asociadas.

El sistema permite:
- Gestionar capacitaciones con módulos, lecciones multimedia y formularios de evaluación.
- Administrar usuarios, roles y la estructura organizacional (empresas, unidades, proyectos, centros operativos).
- Enviar y gestionar exámenes ocupacionales por correo electrónico.
- Generar reportes de progreso, analíticas y certificados.
- Controlar el acceso mediante niveles de permisos diferenciados.

### 2. Alcance

Este documento aplica a todos los usuarios que tengan acceso al sistema **MIConocimiento**, incluyendo colaboradores, administradores de capacitaciones, administradores de exámenes y superadministradores. Abarca la descripción funcional completa de todos los módulos del sistema.

### 3. Definiciones y Glosario

| Término | Definición |
|---|---|
| **LMS** | Learning Management System — Sistema de Gestión de Aprendizaje. |
| **Capacitación** | Contenido formativo compuesto por módulos y lecciones que se asigna a colaboradores. |
| **Módulo** | Agrupación temática de lecciones dentro de una capacitación. |
| **Lección** | Unidad de contenido que puede ser un video, imagen, PDF o formulario de evaluación. |
| **Formulario** | Lección de tipo evaluativo compuesta por preguntas de opción única o múltiple. |
| **Colaborador** | Usuario trabajador registrado en el sistema al que se le asignan capacitaciones. |
| **Examen** | Prueba ocupacional (ingreso, periódico, retiro, especial, post-incapacidad) enviada por correo. |
| **Centro Operativo** | Unidad operativa dentro de un proyecto. |
| **KPI** | Key Performance Indicator — Indicador Clave de Rendimiento. |
| **CSV** | Comma-Separated Values — Archivo de valores separados por comas. |
| **UUID** | Identificador Único Universal. |
| **MICampeonato** | Módulo de predicciones deportivas del Mundial FIFA integrado en la plataforma LMS. |
| **Predicción** | Pronóstico de un usuario sobre el resultado de un partido (marcador exacto y ganador). |
| **Predicción Especial** | Pronóstico sobre eventos del torneo (campeón, subcampeón, tercer lugar, máximo goleador). |
| **Edición** | Instancia de un torneo mundial (ej: USA/MX/CA 2026). Solo una edición activa a la vez. |
| **Multiplicador** | Factor que multiplica los puntos base según la fase del torneo (ej: ×2 en Semifinales). |
| **Ranking Mundial** | Tabla de posiciones basada en puntos acumulados de predicciones de partidos. |
| **Ranking Especial** | Tabla de posiciones basada en puntos de predicciones especiales. |

### 4. Arquitectura del Sistema

El sistema se compone de tres capas principales:

| Capa | Tecnología | Descripción |
|---|---|---|
| **Frontend** | React + TypeScript + Vite | Interfaz de usuario SPA (Single Page Application). |
| **Backend** | Django + Django REST Framework | API REST, lógica de negocio y gestión de datos. |
| **Base de datos** | MySQL / SQLite | Almacenamiento persistente de datos. |
| **Proxy reverso** | Nginx | Enrutamiento y servicio de archivos estáticos. |
| **Tareas asíncronas** | Celery + Redis | Procesamiento de tareas en segundo plano (correos, reportes). |
| **Contenedores** | Docker / Docker Compose | Despliegue y orquestación de servicios. |

### 5. Roles y Niveles de Acceso

El sistema cuenta con **cuatro (4) niveles de acceso** que determinan las funcionalidades visibles y accesibles:

| Código | Rol | Descripción | Acceso |
|---|---|---|---|
| **0** | Usuario (Colaborador) | Usuario estándar | Mis Capacitaciones, Ver Capacitación, Reproductor, Formularios, Perfil. |
| **1** | Admin Capacitaciones | Administrador de capacitaciones | Todo lo del Usuario + Dashboard, Gestión de Capacitaciones, Gestión de Usuarios, Crear Usuarios. |
| **3** | Admin Exámenes | Administrador de exámenes | Todo lo del Usuario + Crear Exámenes, Enviar Exámenes, Reportes de Correos, Datos de Empresa, Cargo/Nivel/Regional, Crear Usuario Temporal. **NO** tiene acceso a Gestión de Capacitaciones, Dashboard, Gestión de Usuarios. |
| **4** | SuperAdmin | Acceso total | Todas las funcionalidades del sistema sin restricciones. Puede cambiar roles de otros usuarios, acceder a gestión de capacitaciones y exámenes. |

> **Nota importante:** 
> - Los roles 1 y 4 pueden acceder a la Gestión de Capacitaciones y Dashboard.
> - El rol 3 es **EXCLUSIVO** para administración de exámenes y estructura empresarial.
> - El rol 4 (SuperAdmin) tiene privilegios exclusivos como el cambio de roles y acceso total a todos los módulos.

*[Insertar imagen: Diagrama de roles y permisos del sistema]*

---

## CAPÍTULO II — ACCESO AL SISTEMA

### 6. Inicio de Sesión

La página de inicio de sesión es el punto de entrada al sistema. Se accede a través de la URL principal del sistema.

**Campos requeridos:**
- **Usuario:** Número de cédula del colaborador.
- **Contraseña:** Número de cédula del colaborador (la contraseña es siempre la misma cédula).

> **⚠️ IMPORTANTE — Política de Contraseñas:**  
> En el sistema MIConocimiento, la contraseña de cada usuario es **siempre su número de cédula**. No existe funcionalidad de cambio de contraseña. Al crear un usuario (individual o masivo), el sistema asigna automáticamente la cédula como contraseña. Esta política aplica a todos los roles del sistema sin excepción.

**Flujo de inicio de sesión:**

| Paso | Actividad | Responsable |
|---|---|---|
| 1 | Acceder a la URL del sistema desde cualquier navegador web. | Usuario |
| 2 | Ingresar el nombre de usuario en el campo "Usuario". | Usuario |
| 3 | Ingresar la contraseña en el campo "Contraseña". | Usuario |
| 4 | Hacer clic en el botón **"Iniciar Sesión"**. | Usuario |
| 5 | El sistema valida las credenciales contra el backend (JWT). | Sistema |
| 6 | Si las credenciales son correctas, se redirige al Home (Mis Capacitaciones). | Sistema |
| 7 | Si las credenciales son incorrectas, se muestra un mensaje de error. | Sistema |

**Mensajes de error posibles:**
- "Usuario o contraseña incorrectos"
- Mensaje personalizado desde el backend (campo `detail`).

**Características técnicas:**
- El sistema utiliza autenticación basada en **JWT (JSON Web Token)**.
- El token de acceso se almacena en `localStorage` del navegador.
- Si no existe un token válido, el sistema redirige automáticamente a la página de login.

*[Insertar imagen: Pantalla de inicio de sesión]*

---

### 7. Cierre de Sesión

Para cerrar sesión, el usuario debe:

| Paso | Actividad | Responsable |
|---|---|---|
| 1 | Hacer clic en el botón con el nombre del usuario en la esquina superior derecha de la barra de navegación. | Usuario |
| 2 | Se despliega un menú con las opciones "Mi Perfil" y "Cerrar sesión". | Sistema |
| 3 | Hacer clic en **"Cerrar sesión"**. | Usuario |
| 4 | El sistema elimina el token del almacenamiento local y redirige al login. | Sistema |

*[Insertar imagen: Menú de usuario con opción de cerrar sesión]*

---

### 8. Página No Autorizado

Cuando un usuario intenta acceder a una ruta para la cual no tiene permisos, el sistema lo redirige automáticamente a la página **"No Autorizado"**, informándole que no cuenta con los privilegios necesarios.

*[Insertar imagen: Pantalla de "No Autorizado"]*

---

## CAPÍTULO III — MÓDULO DE NAVEGACIÓN

### 9. Barra de Navegación Superior (Navbar)

La barra de navegación superior está presente en todas las páginas del sistema (excepto login) y contiene:

| Elemento | Ubicación | Descripción |
|---|---|---|
| **Botón de menú (☰)** | Izquierda | Permite abrir o cerrar el menú lateral (Sidebar). |
| **Título "MIConocimiento"** | Centro | Nombre de la plataforma. |
| **Nombre del usuario (👤)** | Derecha | Muestra el nombre completo del usuario autenticado. Al hacer clic, despliega el menú con opciones "Mi Perfil" y "Cerrar sesión". |

**Comportamiento:**
- El nombre del usuario se obtiene dinámicamente del servicio de perfil del backend.
- Si no se puede obtener, se utiliza el nombre almacenado en localStorage como fallback.

*[Insertar imagen: Barra de navegación superior]*

---

### 10. Menú Lateral (Sidebar)

El menú lateral se muestra a la izquierda de la pantalla y su contenido varía según el rol del usuario autenticado.

#### Vista para Usuarios (Rol 0 - Colaborador):

| Sección | Enlace | Descripción |
|---|---|---|
| Capacitaciones | Mis Capacitaciones | Accede a las capacitaciones asignadas al usuario. |

#### Vista para Administradores (Roles 1 y 4):

| Sección | Enlace | Descripción |
|---|---|---|
| **Capacitaciones** | Analítica | Dashboard con métricas y estadísticas. |
| | Capacitaciones | Listado de todas las capacitaciones. |
| | Crear Capacitación | Formulario para crear nueva capacitación. |
| | Mis Capacitaciones | Capacitaciones asignadas al propio usuario. |
| **Usuarios** | Gestionar Usuarios | Listado y gestión de todos los usuarios. |
| | Crear Usuario | Formulario para crear nuevo usuario. |

#### Vista adicional para Roles 3 y 4:

| Sección | Enlace | Descripción |
|---|---|---|
| **Exámenes** | Crear Exámenes | Crear y asignar exámenes por empresa/cargo. |
| | Enviar Exámenes | Enviar exámenes por correo a trabajadores. |
| | Reporte de Correos | Historial y reportes de correos enviados. |
| **Gestión Empresarial** | Datos de Empresa | CRUD de empresas, unidades, proyectos, centros. |
| | Cargo, Nivel y Regional | CRUD de cargos, niveles y regionales. |

> **⚠️ Restricción de Rol 3:** El rol 3 (Admin Exámenes) **NO** tiene acceso a: Analítica, Capacitaciones, Crear Capacitación, Mis Capacitaciones, Gestionar Usuarios, Crear Usuario. Estas opciones solo están disponibles para roles 1 y 4.

**Características:**
- El logo de Regency se muestra en la parte superior del sidebar y funciona como enlace al perfil.
- El menú es responsivo y puede colapsarse/expandirse con el botón ☰.
- El contenido del menú es dinámico según el nivel de acceso.

*[Insertar imagen: Menú lateral vista administrador]*

*[Insertar imagen: Menú lateral vista usuario]*

---

## CAPÍTULO IV — MÓDULO MIS CAPACITACIONES (HOME)

### 11. Vista General de Mis Capacitaciones

La página principal del sistema muestra al usuario las capacitaciones que le han sido asignadas, organizadas en una cuadrícula de tarjetas.

**Características principales:**
- Las capacitaciones se obtienen del endpoint de "Mis Capacitaciones" del backend.
- Se ordenan mostrando primero las **incompletas** y al final las **completadas**.
- Cada capacitación se presenta como una tarjeta visual con imagen, título, barra de progreso y botón de acción.

*[Insertar imagen: Vista Home - Mis Capacitaciones]*

---

### 12. Tarjeta de Capacitación

Cada tarjeta de capacitación muestra la siguiente información:

| Elemento | Descripción |
|---|---|
| **Imagen** | Imagen representativa de la capacitación (si no tiene, muestra "Sin imagen"). |
| **Título** | Nombre de la capacitación. |
| **Barra de progreso** | Indicador visual del porcentaje de avance. |
| **Porcentaje** | Valor numérico del progreso (ej: 75%). |
| **Lecciones** | Conteo de lecciones completadas vs total (ej: 3/5). |
| **Botón de acción** | Varía según el estado: |

**Estados del botón:**

| Estado | Botón | Color | Acción |
|---|---|---|---|
| En progreso | ▶ Continuar | Verde | Navega a la vista detallada de la capacitación. |
| Completada (100%) | Capacitación completada | Gris | Deshabilitado. |
| Desactivada | Capacitación desactivada | Rojo/Gris | Deshabilitado. |

*[Insertar imagen: Tarjeta de capacitación con progreso]*

---

## CAPÍTULO V — MÓDULO DE PERFIL DE USUARIO

### 13. Vista del Perfil

La página de perfil muestra la información completa del usuario autenticado, organizada en las siguientes secciones:

**Sección superior — Información del perfil:**

| Dato | Descripción |
|---|---|
| **Avatar** | Iniciales del nombre y apellido del colaborador. |
| **Nombre completo** | Nombre y apellido del colaborador. |
| **Correo electrónico** | Correo registrado del colaborador. |
| **Teléfono** | Número de teléfono. |
| **Empresa** | Empresa a la que pertenece. |
| **Cargo** | Cargo asignado. |

**Estadísticas rápidas:**

| Indicador | Ícono | Descripción |
|---|---|---|
| Capacitaciones | 📚 | Número total de capacitaciones asignadas. |
| Completadas | ✅ | Número de capacitaciones completadas. |
| Certificados | 🏆 | Número de certificados obtenidos. |

*[Insertar imagen: Perfil de usuario — sección superior]*

---

### 14. Pestaña Capacitaciones

Muestra una cuadrícula de tarjetas con todas las capacitaciones asignadas al usuario.

**Cada tarjeta incluye:**
- Título de la capacitación.
- Barra de progreso con porcentaje.
- Conteo de lecciones completadas.
- Botón de acción según estado (Continuar / Completada / Desactivada).

*[Insertar imagen: Pestaña Capacitaciones del perfil]*

---

### 15. Pestaña Certificados

Muestra los certificados obtenidos por capacitaciones completadas.

**Cada certificado incluye:**
- Ícono de medalla (🏅).
- Puntuación obtenida.
- Nombre de la capacitación.
- Fecha de emisión.
- Número de certificado (formato: CERT-XXXXXX).

> **Nota:** La funcionalidad de descarga de certificados en PDF está disponible en el backend pero actualmente comentada en el frontend.

*[Insertar imagen: Pestaña Certificados del perfil]*

---

### 16. Pestaña Información

Muestra los datos organizacionales completos del colaborador:

| Dato | Descripción |
|---|---|
| Empresa | Empresa a la que pertenece. |
| Centro de Operación | Centro operativo asignado. |
| Nivel | Nivel organizacional. |
| Regional | Regional asignada. |
| Cargo | Cargo del colaborador. |
| Proyecto | Proyecto asignado. |
| Unidad | Unidad organizacional. |

*[Insertar imagen: Pestaña Información del perfil]*

---

## CAPÍTULO VI — MÓDULO VER CAPACITACIÓN

### 17. Detalle de Capacitación

Cuando un usuario selecciona una capacitación, accede a la vista detallada que muestra:

| Sección | Contenido |
|---|---|
| **Encabezado** | Título de la capacitación e imagen principal. |
| **Descripción** | Texto descriptivo de la capacitación. |
| **Progreso** | Barra de progreso con conteo de lecciones completadas vs total. |
| **Lista de módulos** | Módulos colapsables/expandibles con sus lecciones. |

*[Insertar imagen: Vista detallada de capacitación]*

---

### 18. Módulos y Lecciones

Los módulos se presentan como tarjetas colapsables con un encabezado que muestra:
- Nombre del módulo.
- Número de lecciones.
- Barra de progreso del módulo.
- Porcentaje de completado.
- Botón expandir/colapsar (˅/˄).

Al expandir un módulo, se muestran las lecciones con:

| Elemento | Descripción |
|---|---|
| **Indicador de estado** | ✓ (completada) / ○ (pendiente). |
| **Título de la lección** | Nombre de la lección. |
| **Duración** | Tiempo estimado. |
| **Botón de acción** | Varía según el tipo de lección. |

**Tipos de lección y botones:**

| Tipo | Botón | Acción |
|---|---|---|
| Video | Reproducir | Abre el reproductor de video. |
| Imagen | Ver imagen | Abre el visor de imágenes. |
| PDF | Ver PDF | Abre el visor de PDF. |
| Formulario | Realizar formulario | Abre el formulario de evaluación (solo si las demás lecciones del módulo están completadas). |

> **Regla de negocio:** Los formularios de evaluación solo se habilitan cuando **todas las demás lecciones del módulo** han sido completadas. Si no se han completado, se muestra el mensaje "Completa las lecciones primero".

*[Insertar imagen: Módulos expandidos con lecciones]*

---

### 19. Reproductor de Video

El reproductor de video soporta dos tipos de fuentes:

**a) Videos locales (archivos MP4 subidos al servidor):**
- Se reproducen con el elemento HTML5 `<video>`.
- Al finalizar el video completo, la lección se marca automáticamente como completada.
- Mensaje: "Debes ver el video completo para continuar".

**b) Videos de YouTube:**
- Se reproducen mediante la API de YouTube IFrame.
- Se detectan automáticamente URLs de YouTube (`youtube.com`, `youtu.be`).
- Al terminar el video, se marca como completado automáticamente.

**Controles:**
- Controles nativos de video (play, pausa, volumen, pantalla completa).
- Botón "Finalizar lección y volver" (disponible tras completar el video).

*[Insertar imagen: Reproductor de video]*

---

### 20. Visor de Imágenes y PDF

#### Visor de Imágenes:
- Muestra la imagen de la lección en tamaño completo.
- Incluye descripción de la lección (si la tiene).
- Botón **"Finalizar lección y volver"** para marcar como completada.

#### Visor de PDF:
- Abre automáticamente el PDF en una nueva pestaña del navegador.
- Muestra el PDF embebido en un iframe dentro de la página.
- Enlace para **"Abrir PDF en nueva pestaña"**.
- Botón **"Finalizar lección y volver"** para marcar como completada.

*[Insertar imagen: Visor de imagen/PDF]*

---

### 21. Formulario de Evaluación (Responder Lección)

El formulario permite responder preguntas de evaluación asociadas a una lección de tipo "formulario".

**Estructura del formulario:**

| Elemento | Descripción |
|---|---|
| **Título** | Nombre de la lección / formulario. |
| **Descripción** | Instrucciones del formulario (si las tiene). |
| **Preguntas** | Lista numerada de preguntas con sus opciones. |
| **Botón Enviar** | Envía las respuestas al servidor. |

**Tipos de preguntas:**

| Tipo | Comportamiento |
|---|---|
| **Opción única** | Se permite seleccionar solo una respuesta. |
| **Opción múltiple** | Se permite seleccionar varias respuestas. Se indica con badge "Selecciona múltiples". |

**Elementos de cada pregunta:**
- Número de pregunta (ej: "pregunta 1.").
- Imagen asociada a la pregunta (si la tiene).
- Texto de la pregunta.
- Opciones de respuesta (con imágenes opcionales).

**Flujo de respuesta:**

| Paso | Actividad | Responsable |
|---|---|---|
| 1 | Leer la pregunta y observar la imagen (si aplica). | Usuario |
| 2 | Seleccionar la(s) respuesta(s) correcta(s). | Usuario |
| 3 | Repetir para todas las preguntas del formulario. | Usuario |
| 4 | Hacer clic en **"Enviar respuestas"**. | Usuario |
| 5 | El sistema valida y registra las respuestas. | Sistema |
| 6 | Se muestra mensaje de éxito y se redirige a la capacitación. | Sistema |

> **Prerequisito:** Todas las lecciones de tipo no-formulario del módulo deben estar completadas antes de poder acceder al formulario.

*[Insertar imagen: Formulario de evaluación con preguntas]*

---

## CAPÍTULO VII — MÓDULO ANALÍTICA (DASHBOARD)

### 22. Panel de Analíticas

El Dashboard es accesible **EXCLUSIVAMENTE** para usuarios con rol **Admin Capacitaciones (1)** o **SuperAdmin (4)**. El rol 3 (Admin Exámenes) no tiene acceso a esta funcionalidad. Presenta métricas y estadísticas del progreso de las capacitaciones a nivel organizacional.

*[Insertar imagen: Vista general del Dashboard de Analíticas]*

---

### 23. KPIs Principales

Se muestran tres indicadores clave:

| KPI | Ícono | Descripción |
|---|---|---|
| **Progreso Promedio** | 📊 | Porcentaje promedio de avance de todas las empresas/unidades. |
| **Total Unidades** | 💼 | Número total de unidades organizativas registradas. |
| **Total Proyectos** | 📁 | Número total de proyectos activos. |

*[Insertar imagen: Tarjetas KPI del Dashboard]*

---

### 24. Estructura Organizacional Interactiva

Se presenta una vista tipo árbol que muestra la jerarquía organizacional con los niveles:

**Jerarquía:** Unidades → Proyectos → Centros de Operación

| Nivel | Ícono | Información |
|---|---|---|
| Unidad | 💼 | Nombre y porcentaje de progreso. |
| Proyecto | 📁 | Nombre y porcentaje de progreso. |
| Centro Operativo | 🎯 | Nombre y porcentaje de progreso. |

**Características:**
- Cada nodo muestra una barra de progreso con su porcentaje.
- Los nodos con hijos son expandibles/colapsables (botón ▼).
- Se incluye una tabla con los **proyectos con mayor progreso** (Top 5).

*[Insertar imagen: Estructura organizacional interactiva con progreso]*

---

## CAPÍTULO VIII — MÓDULO GESTIÓN DE CAPACITACIONES (ADMIN)

### 25. Listado de Capacitaciones

Página de gestión disponible **EXCLUSIVAMENTE** para roles **Admin Capacitaciones (1)** y **SuperAdmin (4)**. El rol 3 (Admin Exámenes) no tiene acceso a esta sección.

**Elementos de la interfaz:**

| Elemento | Descripción |
|---|---|
| **Título** | "Capacitaciones" con subtítulo "Gestión de capacitaciones y entrenamientos". |
| **Botón "📊 Generar Reporte"** | Abre modal para descargar reporte Excel por rango de fechas. |
| **Botón "+ Crear Capacitación"** | Navega al formulario de creación. |
| **Buscador** | Filtro por nombre de capacitación. |
| **Filtro por tipo** | Selector: Todos, Curso, Taller, Seminario, Evento. |
| **Contador de resultados** | Muestra "X de Y resultados". |

**Columnas de la tabla:**

| Columna | Descripción |
|---|---|
| Título | Nombre de la capacitación. |
| Descripción | Texto descriptivo. |
| Fecha creación | Fecha de creación. |
| Colaboradores | Total de colaboradores asignados. |
| Completados | Número de colaboradores que completaron. |
| % Completado | Porcentaje de completado global. |
| Fecha Inicio/Fin | Rango de fechas de la capacitación. |
| Estado | Badge: Activa (verde), Inactiva (rojo), Borrador (gris). |
| Acciones | Menú de opciones (☰). |

**Menú de acciones por capacitación:**

| Acción | Descripción |
|---|---|
| **Ver** | Navega a la vista de usuarios de la capacitación. |
| **Editar** | Abre el formulario de edición de la capacitación. |
| **Editar colaboradores** | Navega a la gestión de colaboradores asignados. |
| **Activar/Desactivar** | Cambia el estado de la capacitación (con confirmación). |
| **Eliminar** | Elimina la capacitación (con confirmación). |

**Paginación:** 5 registros por página con botones Anterior/Siguiente.

*[Insertar imagen: Listado de capacitaciones con tabla]*

---

### 26. Crear / Editar Capacitación

Formulario completo para crear o editar una capacitación. Si se accede con un ID, se cargan los datos existentes para edición. **Acceso restringido:** Roles 1 y 4 únicamente. El rol 3 no puede acceder.

**Datos generales de la capacitación:**

| Campo | Tipo | Descripción | Requerido |
|---|---|---|---|
| Título | Texto | Nombre de la capacitación. | Sí |
| Descripción | Texto largo | Descripción detallada. | Sí |
| Imagen | Archivo (JPG/JPEG/PNG, máx 5MB) | Imagen representativa. | No |
| Fecha de inicio | Fecha | Fecha de inicio de la capacitación. | Sí |
| Fecha de fin | Fecha | Fecha de finalización. | Sí |
| Tipo | Selector | Categoría de la capacitación. | Sí |

**Tipos de capacitación disponibles:**
- CONOCIMIENTOS ORGANIZACIONALES
- CONOCIMIENTOS TÉCNICOS
- HABILIDADES BLANDAS
- HABILIDADES TECNICAS
- SOCIAL
- LEGAL

**Características adicionales:**
- Auto-guardado en localStorage (formulario y módulos).
- Previsualización de imagen antes de subir.
- Validación de formato y tamaño de imagen.

*[Insertar imagen: Formulario de creación de capacitación — datos generales]*

---

### 27. Gestión de Módulos y Lecciones

Dentro del formulario de crear/editar capacitación, se gestionan los módulos y sus lecciones.

**Módulos:**

| Acción | Descripción |
|---|---|
| **Agregar Módulo** | Crea un nuevo módulo con nombre auto-generado (ej: "3. Módulo"). |
| **Eliminar Módulo** | Elimina el módulo completo (con confirmación). |
| **Expandir/Colapsar** | Los módulos son acordeones colapsables. |

**Lecciones (dentro de cada módulo):**

| Acción | Descripción |
|---|---|
| **Agregar Lección** | Crea una nueva lección dentro del módulo y la expande automáticamente. |
| **Eliminar Lección** | Elimina la lección seleccionada. |
| **Expandir/Colapsar** | Las lecciones son acordeones dentro del módulo. |

**Campos de cada lección:**

| Campo | Tipo | Descripción |
|---|---|---|
| Título | Texto | Nombre de la lección. |
| Descripción | Texto | Descripción de la lección. |
| Duración | Texto | Tiempo estimado. |
| Tipo de lección | Selector | Video, Imagen, PDF, Formulario. |
| Archivo/URL | Archivo o texto | Según el tipo: archivo local o URL de YouTube. |

**Validaciones por tipo de lección:**

| Tipo | Archivos aceptados |
|---|---|
| Video | URL de YouTube o archivo de video. |
| Imagen | JPG, JPEG, PNG. |
| PDF | Archivos PDF (.pdf). |
| Formulario | No requiere archivo, se configura con preguntas. |

*[Insertar imagen: Gestión de módulos y lecciones]*

---

### 28. Gestión de Preguntas y Respuestas (Formularios)

Para lecciones de tipo "Formulario", se gestionan las preguntas y respuestas.

**Preguntas:**

| Campo | Tipo | Descripción |
|---|---|---|
| Texto de la pregunta | Texto | Enunciado de la pregunta. |
| Tipo de pregunta | Automático | Se determina por el número de respuestas correctas (única/múltiple). |
| Imagen multimedia | Archivo (JPG/JPEG/PNG) | Imagen asociada a la pregunta (opcional). |

**Respuestas (por cada pregunta):**

| Campo | Tipo | Descripción |
|---|---|---|
| Valor | Texto | Texto de la respuesta. |
| Es correcta | Checkbox | Indica si la respuesta es correcta. |
| Imagen | Archivo (JPG/JPEG/PNG) | Imagen de la respuesta (opcional). |

**Acciones:**

| Acción | Descripción |
|---|---|
| Agregar Pregunta | Añade una nueva pregunta vacía con una respuesta. |
| Eliminar Pregunta | Elimina la pregunta y libera memoria de previsualizaciones. |
| Agregar Respuesta | Añade una opción de respuesta a la pregunta. |
| Eliminar Respuesta | Elimina una opción de respuesta. |

> **Lógica automática:** Si se marca más de una respuesta como correcta, el tipo de pregunta cambia automáticamente a "opción múltiple". Si solo hay una correcta, cambia a "opción única".

*[Insertar imagen: Creación de preguntas y respuestas]*

---

### 29. Asignación de Colaboradores

En el formulario de crear/editar capacitación, se pueden asignar colaboradores.

**Métodos de búsqueda de colaboradores:**
- Búsqueda por nombre, apellido, cédula o ID.
- Los resultados se filtran en tiempo real.

**Información mostrada de cada colaborador:**
- ID del colaborador.
- Nombre y apellido.
- Cédula.
- Correo.
- Cargo.
- Empresa.

*[Insertar imagen: Asignación de colaboradores a capacitación]*

---

### 30. Editar Colaboradores de una Capacitación

Página dedicada para gestionar los colaboradores asignados a una capacitación existente.

**Funcionalidades:**

| Acción | Descripción |
|---|---|
| **Subir CSV** | Carga un archivo CSV con cédulas de colaboradores. Reemplaza la lista actual. |
| **CSV Ejemplo** | Descarga un archivo CSV de ejemplo con la estructura requerida (columna "cedula"). |
| **Quitar colaborador** | Elimina un colaborador de la lista (con confirmación). |
| **Guardar cambios** | Envía al backend las diferencias (agregados y removidos) respecto al estado original. |

**Tabla de colaboradores:**

| Columna | Descripción |
|---|---|
| # | Número secuencial. |
| Nombre | Nombre del colaborador. |
| Apellido | Apellido del colaborador. |
| Cédula | Número de cédula. |
| Acción | Botón ✕ para eliminar. |

**Advertencias CSV:**
- Si el archivo contiene cédulas de colaboradores no encontrados en el sistema, se muestra una advertencia con la cantidad y las cédulas no encontradas.

*[Insertar imagen: Edición de colaboradores con tabla y opciones CSV]*

---

### 31. Usuarios de una Capacitación (Progreso)

Vista que muestra el progreso de todos los usuarios asignados a una capacitación específica.

**Elementos de la interfaz:**

| Elemento | Descripción |
|---|---|
| **Título** | "Usuarios de la capacitación". |
| **Botón "📊 Generar Reporte"** | Descarga un reporte Excel de la capacitación. |
| **Botón "← Volver"** | Regresa a la página anterior. |
| **Filtro por estado** | Selector: Todos, Completados, No completados. |
| **Buscador** | Búsqueda por nombre, apellido o cédula. |

**Columnas de la tabla:**

| Columna | Descripción |
|---|---|
| Nombre | Nombre del usuario. |
| Apellido | Apellido del usuario. |
| Cédula | Número de cédula. |
| Progreso | Barra de progreso con porcentaje (verde si 100%, rojo si < 100%). |
| Fecha registro | Fecha en que se registró al usuario. |
| Fecha completada | Fecha de completación o "No completado". |

**Paginación:** 20 registros por página.

*[Insertar imagen: Tabla de usuarios con progreso de capacitación]*

---

### 32. Perfil de Usuario en Capacitación (Admin)

Vista que permite a un administrador ver el progreso detallado de un colaborador específico en una capacitación, incluyendo:
- Imagen y título de la capacitación.
- Descripción.
- Progreso general con barra.
- Lista de módulos con lecciones y estado de completado de cada una.

> Esta vista es la misma que "Ver Capacitación" pero aplicada al perfil de un colaborador específico, combinando datos de la capacitación con el progreso individual.

*[Insertar imagen: Perfil de usuario en capacitación — vista admin]*

---

### 33. Generación de Reportes de Capacitaciones

**Reporte por rango de fechas:**

| Paso | Actividad | Responsable |
|---|---|---|
| 1 | Hacer clic en el botón **"📊 Generar Reporte"** en el listado de capacitaciones. | Admin |
| 2 | Se abre un modal con campos de fecha inicio y fecha fin. | Sistema |
| 3 | Seleccionar la fecha de inicio. | Admin |
| 4 | Seleccionar la fecha de fin. | Admin |
| 5 | Hacer clic en **"Descargar"**. | Admin |
| 6 | El sistema genera y descarga un archivo Excel (.xlsx). | Sistema |

**Validaciones:**
- Ambas fechas son obligatorias.
- La fecha de inicio no puede ser mayor que la fecha de fin.
- El nombre del archivo descargado incluye el rango de fechas.

**Reporte por capacitación individual:**
- Disponible desde la vista de "Usuarios de una Capacitación".
- Descarga un Excel con el progreso de todos los usuarios de esa capacitación.

*[Insertar imagen: Modal de generación de reporte por fechas]*

---

## CAPÍTULO IX — MÓDULO GESTIÓN DE USUARIOS

### 34. Listado de Usuarios

Página de gestión de colaboradores disponible **EXCLUSIVAMENTE** para roles **Admin Capacitaciones (1)** y **SuperAdmin (4)**. El rol 3 (Admin Exámenes) no tiene acceso a esta sección.

**Elementos de la interfaz:**

| Elemento | Descripción |
|---|---|
| **Título** | "Usuarios" con subtítulo "Gestión de colaboradores". |
| **Buscador** | Búsqueda por cédula (con botón "Buscar" o tecla Enter). |
| **Contador** | "X de Y resultados". |

**Columnas de la tabla:**

| Columna | Descripción |
|---|---|
| Cédula | Número de cédula del colaborador. |
| Nombre | Nombre del colaborador. |
| Apellido | Apellido del colaborador. |
| Correo | Correo electrónico. |
| Cargo | Nombre del cargo. |
| Capacitaciones Totales | Número de capacitaciones asignadas. |
| Capacitaciones Completadas | Número completadas. |
| Estado | Badge: Activo (verde), Inactivo (rojo). |
| Acciones | Menú de opciones (☰). |

**Menú de acciones por usuario:**

| Acción | Rol requerido | Descripción |
|---|---|---|
| **Ver** | Todos los admin | Navega al perfil detallado del usuario. |
| **Editar** | Todos los admin | Navega al formulario de edición del usuario. |
| **Cambiar Estado** | Admin (1) y SuperAdmin (4) | Activa o desactiva al usuario (con confirmación). |
| **Cambiar Rol** | Solo SuperAdmin (4) | Cambia el tipo de usuario mediante prompt. |

**Paginación:** 10 registros por página con paginación del servidor.

*[Insertar imagen: Listado de usuarios con tabla y acciones]*

---

### 35. Crear Usuario

Formulario para crear nuevos usuarios en el sistema. Presenta dos modos según el rol del usuario:

#### a) Crear Usuario Temporal (Roles 3 y 4):

Formulario simplificado para crear usuarios con datos básicos.

| Campo | Descripción | Requerido |
|---|---|---|
| Cédula | Se usa también como nombre de usuario y contraseña. | Sí |
| Nombre | Nombre del colaborador. | Sí |
| Apellido | Apellido del colaborador. | Sí |
| Correo | Correo electrónico. | Sí |
| Teléfono | Número de teléfono. | No |

#### b) Crear Usuario Completo (Roles 1 y 4):

Formulario completo con todos los datos organizacionales.

| Campo | Descripción | Requerido |
|---|---|---|
| Cédula | Número de cédula (también se usa como usuario). | Sí |
| Nombre | Nombre del colaborador. | Sí |
| Apellido | Apellido del colaborador. | Sí |
| Cargo | Selector de cargo registrado en el sistema. | Sí |
| Nivel | Selector de nivel organizacional. | Sí |
| Regional | Selector de regional. | Sí |
| Empresa | Selector de empresa. | Sí |
| Unidad | Selector de unidad (depende de empresa). | Sí |
| Proyecto | Selector de proyecto (depende de unidad). | Sí |
| Centro Operativo | Selector de centro (depende de proyecto). | Sí |
| Correo | Correo electrónico. | Sí |
| Teléfono | Número de teléfono. | No |

> **Nota:** Los selectores de unidad, proyecto y centro operativo funcionan en cascada: al seleccionar empresa se cargan las unidades, al seleccionar unidad se cargan los proyectos, etc.

*[Insertar imagen: Formulario de crear usuario completo]*

*[Insertar imagen: Formulario de crear usuario temporal]*

---

### 36. Editar Usuario

Formulario para editar la información de un usuario existente.

**Campos editables:**

| Campo | Descripción |
|---|---|
| Nombre | Nombre del colaborador. |
| Apellido | Apellido. |
| Correo | Correo electrónico. |
| Teléfono | Número de teléfono. |
| Cargo | Selector de cargo. |
| Nivel | Selector de nivel. |
| Regional | Selector de regional. |
| Empresa → Unidad → Proyecto → Centro | Selectores en cascada. |

**Comportamiento:**
- Los datos actuales del usuario se pre-cargan al abrir el formulario.
- Si el usuario tiene un centro operativo asignado, se detecta automáticamente la empresa, unidad y proyecto correspondientes.
- Se requiere confirmación antes de guardar los cambios.

*[Insertar imagen: Formulario de editar usuario]*

---

### 37. Cambiar Estado de Usuario

Disponible para roles **Admin (1)** y **SuperAdmin (4)**.

| Paso | Actividad | Responsable |
|---|---|---|
| 1 | Hacer clic en el menú de acciones (☰) del usuario. | Admin |
| 2 | Seleccionar **"Cambiar Estado"**. | Admin |
| 3 | Confirmar la acción en el diálogo de confirmación. | Admin |
| 4 | El estado se actualiza (Activo → Inactivo o viceversa). | Sistema |
| 5 | Se muestra un mensaje de éxito. | Sistema |

*[Insertar imagen: Confirmación de cambio de estado]*

---

### 38. Cambiar Rol de Usuario

Disponible **exclusivamente** para el rol **SuperAdmin (4)**.

| Paso | Actividad | Responsable |
|---|---|---|
| 1 | Hacer clic en el menú de acciones (☰) del usuario. | SuperAdmin |
| 2 | Seleccionar **"Cambiar Rol"**. | SuperAdmin |
| 3 | Ingresar el nuevo tipo de usuario en el prompt. | SuperAdmin |
| 4 | Valores válidos: 0 (Usuario), 1 (Admin Capacitaciones), 3 (Admin Exámenes), 4 (SuperAdmin). | SuperAdmin |
| 5 | El rol se actualiza y la tabla se recarga. | Sistema |

*[Insertar imagen: Prompt de cambio de rol]*

---

## CAPÍTULO X — MÓDULO DE EXÁMENES

### 39. Crear Examen

Página con dos pestañas: **"➕ Crear Examen"** y **"✏️ Editar Asignaciones"**. Accesible para roles **3** y **4**.

**Pestaña "Crear Examen":**

| Campo | Tipo | Descripción | Requerido |
|---|---|---|---|
| Nombre del examen | Texto | Nombre identificativo del examen. | Sí |
| Tipos de examen | Selector múltiple | Selección de tipos aplicables. | Sí (al menos uno) |
| Empresas | Selector múltiple con búsqueda | Empresas a las que aplica. | Sí (al menos una) |
| Cargos | Selector múltiple con búsqueda | Cargos a los que aplica. | Sí (al menos uno) |

**Tipos de examen disponibles:**

| Tipo | Descripción |
|---|---|
| INGRESO | Examen de ingreso. |
| PERIODICO | Examen periódico. |
| RETIRO | Examen de retiro. |
| ESPECIAL | Examen especial. |
| POST_INCAPACIDAD | Examen post incapacidad. |

**Selectores con búsqueda:**
- Cada selector tiene un campo de búsqueda para filtrar opciones.
- Los elementos seleccionados se muestran como lista con opción "Quitar".
- Los elementos ya seleccionados no aparecen en la lista de búsqueda.

*[Insertar imagen: Formulario de crear examen con selectores]*

---

### 40. Editar Asignaciones de Exámenes

**Pestaña "Editar Asignaciones":**

Permite gestionar qué exámenes están asignados a un cargo dentro de una empresa y tipo.

**Flujo:**

| Paso | Actividad | Responsable |
|---|---|---|
| 1 | Seleccionar la empresa. | Admin |
| 2 | Seleccionar el cargo. | Admin |
| 3 | Se cargan las asignaciones actuales por tipo de examen. | Sistema |
| 4 | Seleccionar un tipo de examen para ver sus exámenes asignados. | Admin |
| 5 | Agregar o quitar exámenes según necesidad. | Admin |
| 6 | Hacer clic en **"Aplicar cambios"** para guardar. | Admin |

**Acciones:**

| Acción | Descripción |
|---|---|
| **Agregar examen** | Busca y agrega un examen del catálogo global. |
| **Quitar examen** | Marca un examen para eliminación. |
| **Aplicar cambios** | Ejecuta las adiciones y eliminaciones pendientes. |
| **Cancelar cambios** | Descarta los cambios pendientes. |

*[Insertar imagen: Editor de asignaciones de exámenes]*

---

### 41. Enviar Exámenes por Correo

Página para enviar exámenes a trabajadores individuales por correo electrónico.

**Formulario de envío individual:**

| Campo | Tipo | Descripción | Requerido |
|---|---|---|---|
| Empresa | Selector | Empresa del trabajador. | Sí |
| Unidad | Selector (cascada) | Unidad de la empresa. | Sí |
| Proyecto | Selector (cascada) | Proyecto de la unidad. | Sí |
| Centro Operativo | Selector (cascada) | Centro operativo del proyecto. | Sí |
| Cargo | Selector | Cargo del trabajador. | Sí |
| Tipo de Examen | Selector | INGRESO, PERIÓDICO, RETIRO, ESPECIAL, POST INCAPACIDAD. | Sí |
| Nombre del trabajador | Texto | Nombre completo del trabajador. | Sí |
| Documento del trabajador | Texto | Número de documento. | Sí |
| Ciudad | Texto | Ciudad del trabajador. | No |

**Exámenes sugeridos:**
- Al seleccionar empresa, cargo y tipo de examen, se cargan automáticamente los exámenes asignados.
- Se pueden quitar exámenes sugeridos y agregar otros manualmente desde el buscador.

**Buscador de exámenes:**
- Campo de búsqueda por nombre del examen.
- Botones "➕ Nombre del examen" para agregar.
- Se excluyen los exámenes ya seleccionados.

*[Insertar imagen: Formulario de envío de exámenes]*

---

### 42. Envío Masivo de Exámenes (CSV)

Permite enviar exámenes a múltiples trabajadores mediante un archivo CSV.

| Paso | Actividad | Responsable |
|---|---|---|
| 1 | Hacer clic en **"📤 Envío Masivo (CSV)"**. | Admin |
| 2 | Se abre un modal para cargar el archivo. | Sistema |
| 3 | Seleccionar un archivo CSV con el formato requerido. | Admin |
| 4 | Hacer clic en **"Enviar"**. | Admin |
| 5 | El sistema procesa el archivo y envía los correos. | Sistema |
| 6 | Se muestra el resultado con detalle de envíos exitosos y fallidos. | Sistema |

**Validaciones:**
- Solo se aceptan archivos con extensión `.csv`.
- El archivo debe seguir el formato esperado por el backend.
- Se muestran errores detallados si el backend rechaza registros.

*[Insertar imagen: Modal de envío masivo CSV]*

---

## CAPÍTULO XI — MÓDULO REPORTES DE CORREOS

### 43. Listado de Reportes de Correos

Página que muestra el historial de todos los correos de exámenes enviados.

**Elementos de la interfaz:**

| Elemento | Descripción |
|---|---|
| **Título** | "Reportes de Correos". |
| **Botón "📥 Generar Excel"** | Abre modal para generar reporte Excel filtrado. |
| **Buscador** | Búsqueda por UUID del correo. |
| **Filtro por colaborador** | Selector para filtrar por remitente. |

**Columnas de la tabla:**

| Columna | Descripción |
|---|---|
| UUID | Identificador único del correo. |
| Correos destino | Dirección(es) de correo destinatario(s). |
| Enviado por | Nombre del usuario que envió. |
| Fecha de envío | Fecha y hora del envío. |
| Estado | Enviado correctamente (✓) o con error (✕). |
| Acciones | Botones "Ver" y "Trabajadores". |

**Paginación:** 10 registros por página con paginación del servidor.

*[Insertar imagen: Listado de reportes de correos]*

---

### 44. Detalle de Correo Enviado

Al hacer clic en **"Ver"** en un correo, se abre un modal con información detallada:

| Dato | Descripción |
|---|---|
| ID del correo | Identificador numérico. |
| UUID | Identificador único universal. |
| Asunto | Asunto del correo. |
| Correo destino | Dirección(es) de destino. |
| Fecha de envío | Fecha y hora. |
| Total trabajadores | Número de trabajadores incluidos. |
| Cuerpo del correo | Contenido HTML del correo. |

*[Insertar imagen: Modal de detalle de correo]*

---

### 45. Trabajadores por Correo

Al hacer clic en **"Trabajadores"**, se navega a una vista que muestra los trabajadores asociados a un correo enviado.

**Información del correo (encabezado):**
- ID y UUID del correo.
- Asunto y fecha de envío.
- Total de trabajadores.

**Tabla de trabajadores:**

| Columna | Descripción |
|---|---|
| Checkbox | Selector para acciones masivas. |
| UUID | UUID del trabajador. |
| Nombre | Nombre del trabajador. |
| Documento | Número de documento. |
| Cargo | Cargo del trabajador. |
| Empresa | Empresa del trabajador. |
| Estado | Estado del trabajador (badge). |

**Acciones disponibles:**
- **Buscar por UUID:** Filtro de búsqueda en el frontend.
- **Actualizar estado:** Actualiza el estado de los trabajadores seleccionados (checkbox).
- **Botón "← Volver":** Regresa a la lista de reportes.

*[Insertar imagen: Tabla de trabajadores por correo]*

---

### 46. Generación de Reporte Excel

Modal para generar un reporte Excel de correos enviados.

| Campo | Descripción | Requerido |
|---|---|---|
| Fecha de inicio | Fecha desde la que se filtran correos (por defecto: primer día del mes). | Sí |
| Fecha de fin | Fecha hasta la que se filtran (por defecto: último día del mes). | Sí |
| Empresas | Selector múltiple de empresas a incluir en el reporte. | Sí (al menos una) |

**Resultado:** Se descarga un archivo `.xlsx` con nombre `reporte_correos_FECHA_INICIO_FECHA_FIN.xlsx`.

*[Insertar imagen: Modal de generación de reporte Excel]*

---

### 47. Filtro por Colaborador y Búsqueda por UUID

**Filtro por colaborador:**
- Selector que muestra los colaboradores que han enviado correos.
- Botones "Aplicar filtro" y "Limpiar".

**Búsqueda por UUID:**
- Campo de texto para ingresar el UUID del correo.
- Se ejecuta al presionar Enter o hacer clic en "Buscar".
- Consulta directamente al backend.

*[Insertar imagen: Filtros de búsqueda de reportes]*

---

## CAPÍTULO XII — MÓDULO GESTIÓN EMPRESARIAL

### 48. Datos de Empresa

Página de gestión de la estructura organizacional. Accesible para roles **3** y **4**.

**Funcionalidades de creación disponibles:**

| Tipo | Descripción |
|---|---|
| **Empresa** | Crear una nueva empresa con nombre y NIT. |
| **Unidad** | Crear una unidad asociada a una o más empresas. |
| **Proyecto** | Crear un proyecto asociado a una o más unidades. |
| **Centro Operativo** | Crear un centro operativo asociado a uno o más proyectos. |

**Crear Empresa:**

| Campo | Descripción | Requerido |
|---|---|---|
| Nombre de la empresa | Nombre identificativo. | Sí |
| NIT | Número de Identificación Tributaria (por defecto "0"). | No |

*[Insertar imagen: Formulario de crear empresa]*

---

### 49. Gestión de Unidades

**Crear Unidad:**

| Campo | Descripción | Requerido |
|---|---|---|
| Nombre de la unidad | Nombre identificativo. | Sí |
| Descripción | Descripción de la unidad. | No |
| Empresas | Selector múltiple con búsqueda. Se crea la unidad en cada empresa seleccionada. | Sí (al menos una) |

**Editar Unidad:**
- Selector de unidad existente.
- Campo para nuevo nombre.
- Botón "Actualizar".

*[Insertar imagen: Formulario de crear/editar unidad]*

---

### 50. Gestión de Proyectos

**Crear Proyecto:**

| Campo | Descripción | Requerido |
|---|---|---|
| Nombre del proyecto | Nombre identificativo. | Sí |
| Empresa | Selector de empresa (para filtrar unidades). | Sí |
| Unidad | Selector de unidad (depende de empresa). Se pueden agregar múltiples pares empresa-unidad. | Sí (al menos una) |

**Editar Proyecto:**
- Selector de proyecto existente.
- Campo para nuevo nombre.
- Botón "Actualizar".

*[Insertar imagen: Formulario de crear/editar proyecto]*

---

### 51. Gestión de Centros Operativos

**Crear Centro Operativo:**

| Campo | Descripción | Requerido |
|---|---|---|
| Nombre del centro | Nombre identificativo. | Sí |
| Empresa | Selector de empresa. | Sí |
| Unidad | Selector de unidad (cascada). | Sí |
| Proyecto | Selector de proyecto (cascada). Se pueden agregar múltiples combinaciones. | Sí (al menos uno) |

**Editar Centro Operativo:**
- Selector de centro existente con cascada empresa → unidad → proyecto.
- Campo para nuevo nombre.
- Botón "Actualizar".

**Funcionalidad de edición general:**
- Todos los tipos (empresa, unidad, proyecto, centro) pueden ser editados cambiando su nombre.
- Se accede a la edición mediante un formulario separado con selector.

*[Insertar imagen: Formulario de crear/editar centro operativo]*

---

### 52. Asignación de Jefes de Proyecto

Funcionalidad dentro de "Datos de Empresa" que permite asignar un jefe a un proyecto.

| Paso | Actividad | Responsable |
|---|---|---|
| 1 | Seleccionar un proyecto. | Admin |
| 2 | Buscar al colaborador por cédula. | Admin |
| 3 | Seleccionar al colaborador de los resultados. | Admin |
| 4 | Confirmar la asignación. | Admin |

**Información del jefe de proyecto visible:**
- Nombre y apellido.
- Correo electrónico.

*[Insertar imagen: Asignación de jefe de proyecto]*

---

### 53. Cargo, Nivel y Regional

Página de gestión de datos maestros con tres pestañas: **Cargos**, **Niveles** y **Regionales**. Accesible para roles **3** y **4**.

**Para cada pestaña (Cargo / Nivel / Regional):**

**Sección "Crear":**

| Campo | Descripción | Requerido |
|---|---|---|
| Nombre | Nombre del cargo/nivel/regional. | Sí |

**Sección "Editar":**

| Campo | Descripción |
|---|---|
| Selector | Lista de registros existentes. |
| Nuevo nombre | Nuevo nombre para el registro seleccionado. |

**Sección "Listado":**
- Lista de todos los registros con buscador.
- Botón **"Desactivar"** por cada registro (con confirmación).

**Mensajes:**
- Éxito: "Cargo/Nivel/Regional creado/actualizado/desactivado correctamente."
- Error: Mensajes del backend o genéricos.

*[Insertar imagen: Gestión de cargos, niveles y regionales]*

---

## CAPÍTULO XII-B — MÓDULO MICampeonato (MUNDIAL)

El módulo **MICampeonato** es una plataforma de predicciones deportivas integrada dentro del sistema LMS MIConocimiento. Fue diseñado con motivo del **Mundial FIFA 2026** para fomentar la integración y el compañerismo entre los colaboradores de la organización mediante un sistema de predicción de resultados de partidos y eventos especiales del torneo.

### 54. Descripción General del Módulo

**MICampeonato** permite a todos los usuarios autenticados participar en un sistema de predicciones del Mundial FIFA. El módulo incluye:

- **Predicción de partidos:** Los usuarios predicen el marcador exacto de cada partido, incluyendo penaltis para partidos de eliminación directa.
- **Predicciones especiales:** Pronósticos sobre eventos del torneo (campeón, subcampeón, tercer lugar, máximo goleador).
- **Sistema de puntuación:** Puntos basados en aciertos exactos, ganadores correctos y multiplicadores por fase del torneo.
- **Rankings:** Tabla de posiciones mundial (partidos) y especial (predicciones especiales) con desempate por aciertos exactos y fecha de primera predicción.
- **Panel de administración:** Gestión completa de partidos, equipos, resultados, configuraciones y predicciones especiales.

**Acceso al módulo:**
- Se accede desde el menú lateral en la sección **"Mi Campeonato"**.
- Todos los usuarios autenticados pueden ver la página de inicio, partidos y rankings.
- Solo los administradores (Rol 1, 4) tienen acceso al panel de administración.

**Rutas del módulo:**

| Ruta | Página | Acceso |
|---|---|---|
| `/mundial` | Inicio MICampeonato | Todos los usuarios autenticados |
| `/mundial/partidos` | Predicción de partidos | Todos los usuarios autenticados |
| `/mundial/ranking` | Rankings (mundial y especial) | Todos los usuarios autenticados |
| `/mundial/admin` | Panel de administración | Admin (Rol 1) y SuperAdmin (Rol 4) |

**Menú lateral (Sidebar):**

| Opción | Ruta | Roles |
|---|---|---|
| Inicio | `/mundial` | Todos |
| Administración | `/mundial/admin` | Rol 1, 4 |

> **Nota:** Las páginas de Partidos y Ranking se acceden desde enlaces dentro de la página de Inicio del Mundial, no directamente desde el menú lateral.

*[Insertar imagen: Página de inicio MICampeonato]*

---

### 55. Ediciones del Mundial

El sistema soporta múltiples **ediciones** de torneos mundiales. Solo puede haber **una edición activa** a la vez.

**Modelo EdicionMundial:**

| Campo | Tipo | Descripción |
|---|---|---|
| nombre | CharField(100) | Nombre de la edición (ej: "USA/MX/CA 2026"). |
| año | IntegerField | Año del torneo. |
| activa | BooleanField | Solo una edición puede estar activa simultáneamente. |
| configuracion_bloqueada | BooleanField | Se bloquea automáticamente 1 hora antes del primer partido. |

**Reglas de negocio:**
- Al activar una edición, todas las demás se desactivan automáticamente.
- La configuración del torneo se bloquea 1 hora antes del primer partido de la edición.
- Todos los datos (partidos, predicciones, rankings) están asociados a la edición activa.

---

### 56. Gestión de Equipos

Los equipos representan a las selecciones nacionales participantes en el torneo.

**Modelo Equipo:**

| Campo | Tipo | Descripción |
|---|---|---|
| nombre | CharField(100, unique) | Nombre del equipo. |
| bandera_imagen | ImageField | Imagen de bandera almacenada localmente. |
| bandera_url | URLField | URL de Cloudinary para la bandera. |
| emoji | CharField(10) | Emoji de bandera como fallback visual (ej: "🇲🇽"). |
| activo | BooleanField | Si está disponible para asignación en partidos. |

**Resolución de bandera (prioridad):**
1. Imagen local (`bandera_imagen`).
2. URL de Cloudinary (`bandera_url`).
3. Emoji como fallback.

**Operaciones (Admin):**
- Crear equipo (imagen se sube a Cloudinary al crear).
- Editar equipo (imagen se almacena localmente al editar).
- Desactivar equipo (soft-delete con campo `activo`).

---

### 57. Gestión de Partidos

Los partidos representan los encuentros del torneo con un ciclo de vida definido por estados.

**Modelo Partido:**

| Campo | Tipo | Descripción |
|---|---|---|
| edicion | FK → EdicionMundial | Edición del torneo. |
| equipo_local / equipo_visitante | FK → Equipo | Equipos que se enfrentan. |
| fecha / hora | DateField / TimeField | Fecha y hora del encuentro. |
| fase | CharField | Grupos, 16avos, Octavos, Cuartos, Semifinales, Tercer Puesto, Final. |
| grupo | CharField(1) | Letra del grupo (A-L), solo aplica para fase de Grupos. |
| multiplicador | CharField(5) | Factor multiplicador de puntos (ej: "x1", "x2"), asignado automáticamente según la fase. |
| estado | CharField | Ciclo: abierto → bloqueado → finalizado. |
| goles_local / goles_visitante | IntegerField | Marcador del tiempo reglamentario (se registra al finalizar). |
| fue_a_penaltis | BooleanField | Indica si el partido fue a penaltis. |
| penaltis_local / penaltis_visitante | IntegerField | Marcador de penaltis (si aplica). |

**Ciclo de vida del partido:**

```
ABIERTO ──(1h antes del partido)──► BLOQUEADO ──(admin registra resultado)──► FINALIZADO
```

| Estado | Descripción | Predicciones |
|---|---|---|
| **Abierto** | Partido programado, abierto a predicciones. | ✅ Permitidas |
| **Bloqueado** | Se bloquea automáticamente 1 hora antes del inicio del partido. | ❌ Cerradas |
| **Finalizado** | Admin registró el resultado. Puntos calculados para todas las predicciones. | ❌ Cerradas |

**Multiplicadores por fase (valores por defecto):**

| Fase | Multiplicador |
|---|---|
| Grupos | x1 |
| 16avos | x1.25 |
| Octavos | x1.5 |
| Cuartos | x1.75 |
| Semifinales | x2 |
| Tercer Puesto | x2.5 |
| Final | x3 |

**Bloqueo automático:**
- El sistema verifica automáticamente en cada consulta si un partido abierto ha superado el umbral de 1 hora antes del inicio.
- Si se cumple la condición, el partido pasa de `abierto` a `bloqueado` de forma transparente (lazy blocking).
- El frontend también valida del lado del cliente como segunda capa de seguridad.

*[Insertar imagen: Tabla de partidos del Mundial]*

---

### 58. Sistema de Predicciones de Partidos

Los usuarios pueden predecir el resultado de cada partido mientras esté en estado **abierto** y falte más de **1 hora** para el inicio.

**Modelo Prediccion:**

| Campo | Tipo | Descripción |
|---|---|---|
| colaborador | FK → Colaboradores | Usuario que realiza la predicción. |
| partido | FK → Partido | Partido predicho. |
| goles_local / goles_visitante | IntegerField | Marcador predicho en tiempo reglamentario. |
| ganador | CharField | "local", "visitante" o "empate". |
| predice_penaltis | BooleanField | Si el usuario predice que habrá penaltis. |
| penaltis_local / penaltis_visitante | IntegerField | Marcador de penaltis predicho (si aplica). |
| ganador_penaltis | CharField | "local" o "visitante" (ganador de penaltis). |
| puntos_regulares | IntegerField | Puntos otorgados por la predicción del tiempo reglamentario. |
| puntos_penaltis | IntegerField | Puntos bonus por predicción de penaltis. |
| fue_resultado_exacto | BooleanField | Si el marcador fue exacto. |

**Restricción:** Un usuario solo puede tener **una predicción por partido** (upsert: crea o actualiza).

**Flujo de predicción (3 pasos):**

1. **Paso 1 — ¿Quién gana?:** El usuario selecciona Local, Empate o Visitante.
   - La opción de empate no está disponible en fase de Grupos.
2. **Paso 2 — Marcador exacto:** El usuario selecciona los goles de cada equipo usando botones +/-.
   - El sistema valida que el marcador coincida con el ganador seleccionado.
3. **Paso 3 — Penaltis (condicional):** Solo se muestra si el usuario seleccionó empate.
   - El usuario puede predecir opcionalmente el marcador de penaltis.
   - Se valida que los penaltis no terminen en empate.

**Información de puntos potenciales:** El modal de predicción muestra los puntos que se podrían ganar (resultado exacto × multiplicador, ganador correcto × multiplicador).

**Edición de predicciones:** Si ya existe una predicción para un partido, el modal se abre con los valores existentes precargados, permitiendo editar antes del cierre.

*[Insertar imagen: Modal de predicción de partido]*

---

### 59. Predicciones Especiales

Las predicciones especiales son pronósticos sobre eventos del torneo que van más allá de los resultados individuales de partidos.

**Tipos de predicciones especiales:**

| Tipo | Descripción | Valor a predecir |
|---|---|---|
| **Campeón** | ¿Qué equipo ganará el torneo? | Equipo (dropdown). |
| **Subcampeón** | ¿Qué equipo quedará en segundo lugar? | Equipo (dropdown). |
| **Tercer Lugar** | ¿Qué equipo quedará en tercer lugar? | Equipo (dropdown). |
| **Máximo Goleador** | ¿Quién será el máximo goleador del torneo? | Nombre de jugador (texto libre). |

**Modelo ConfiguracionPrediccionEspecial:**

| Campo | Tipo | Descripción |
|---|---|---|
| edicion | FK → EdicionMundial | Edición del torneo. |
| tipo | CharField | campeon, subcampeon, tercer_lugar, maximo_goleador. |
| habilitada | BooleanField | Si está activa para los usuarios. |
| fecha_limite | DateTimeField | Fecha límite para enviar predicciones. |
| descripcion | TextField | Texto descriptivo mostrado al usuario. |
| estado | CharField | abierta → bloqueada → resuelta. |
| puntos | IntegerField | Puntos otorgados al acertar (default: 50). |
| resultado_equipo | FK → Equipo | Resultado real (equipo ganador). |
| resultado_jugador | CharField | Resultado real (nombre del jugador goleador). |

**Ciclo de vida:**
```
ABIERTA ──(fecha_limite cumplida)──► BLOQUEADA ──(admin resuelve)──► RESUELTA
```

**Restricción:** Un usuario solo puede tener **una predicción por tipo** (upsert).

**Estados de la tarjeta de predicción:**
- **Sin responder:** Muestra formulario con dropdown de equipos o campo de texto.
- **Respondida y editable:** Muestra la selección actual con posibilidad de cambiar (antes de fecha límite).
- **Respondida y cerrada:** Muestra la selección en modo solo lectura (después de fecha límite).

*[Insertar imagen: Predicciones especiales del Mundial]*

---

### 60. Sistema de Puntuación

El sistema de puntuación determina cuántos puntos recibe un usuario por cada predicción evaluada.

**Puntuación de partidos (tiempo reglamentario):**

| Condición | Puntos Base | Multiplicador | Ejemplo (Semifinal, x2) |
|---|---|---|---|
| **Resultado exacto** (ej: predicción 2-1, real 2-1) | 3 pts | × fase | 3 × 2 = **6 pts** |
| **Ganador correcto** (ej: predicción 3-0, real 1-0) | 1 pt | × fase | 1 × 2 = **2 pts** |
| **Predicción incorrecta** | 0 pts | — | **0 pts** |

> **Nota:** Resultado exacto y ganador correcto son **mutuamente excluyentes** — el sistema otorga el de mayor valor.

**Puntuación de penaltis (bonus adicional):**

| Condición | Puntos Base | Multiplicador |
|---|---|---|
| **Penaltis exactos** (ej: predicción 4-3, real 4-3) | +3 pts | × fase |
| **Ganador de penaltis correcto** (ej: predicción gana local, real gana local) | +1 pt | × fase |

> Los puntos de penaltis solo se otorgan si el partido realmente fue a penaltis **Y** el usuario predijo que habría penaltis.

**Puntos totales por partido:** `puntos_regulares + puntos_penaltis`

**Puntuación de predicciones especiales:**

| Condición | Puntos |
|---|---|
| Predicción especial acertada (campeón, subcampeón, etc.) | 50 pts (configurable por el admin) |
| Predicción especial incorrecta | 0 pts |

**Proceso de evaluación:**
1. Admin registra el resultado del partido → El sistema evalúa **todas** las predicciones automáticamente.
2. Para cada predicción, calcula puntos regulares y de penaltis.
3. Actualiza el ranking de cada predictor.
4. Recalcula las posiciones globales del ranking.

---

### 61. Rankings

El módulo cuenta con **dos rankings independientes** que se actualizan automáticamente al registrar resultados.

**Ranking Mundial (predicciones de partidos):**

| Campo | Descripción |
|---|---|
| Posición | Número de posición en el ranking. |
| Nombre | Nombre del colaborador. |
| Avatar | Iniciales del nombre. |
| Aciertos exactos | Cantidad de marcadores exactos acertados. |
| Tendencia | Movimiento respecto a la posición anterior (↑ subió, ↓ bajó, — igual). |
| Puntos totales | Suma de todos los puntos de predicciones de partidos. |

**Ranking Especial (predicciones especiales):**

| Campo | Descripción |
|---|---|
| Posición | Número de posición. |
| Nombre | Nombre del colaborador. |
| Aciertos especiales | Cantidad de predicciones especiales acertadas. |
| Tendencia | Movimiento de posición. |
| Puntos totales | Suma de puntos de predicciones especiales. |

**Criterios de desempate (en orden de prioridad):**
1. **Mayor cantidad de puntos totales.**
2. **Mayor cantidad de aciertos exactos** (ranking mundial) o **aciertos especiales** (ranking especial).
3. **Fecha de primera predicción más temprana** — quien predijo primero tiene ventaja.

**Visualización del ranking:**
- **Podio:** Top 3 con presentación visual destacada (oro, plata, bronce) — solo en ranking mundial.
- **Tabla completa:** Lista de todos los participantes con estadísticas.
- **Posición del usuario:** Si el usuario actual no está en el top visible, se muestra su posición actual por separado al final.
- **Badge "(Tú)":** Resalta la fila del usuario autenticado.

*[Insertar imagen: Rankings del Mundial]*

---

### 62. Panel de Administración del Mundial

El panel de administración del Mundial es accesible únicamente para los roles **Admin (1)** y **SuperAdmin (4)** en la ruta `/mundial/admin`.

**Pestañas del panel:**

| Pestaña | Funcionalidad |
|---|---|
| **Partidos** | CRUD completo de partidos. Crear, editar, eliminar partidos con selección de equipos, fecha, hora, fase, grupo y estado. |
| **Resultados** | Registrar resultados de partidos bloqueados. Ingresar marcador del tiempo reglamentario y, opcionalmente, penaltis. Al confirmar, se calculan automáticamente los puntos de todas las predicciones y se actualiza el ranking. |
| **Equipos** | CRUD de equipos. Crear con nombre, emoji y bandera (imagen). Editar nombre, emoji, imagen. Desactivar equipos (soft-delete). |
| **Especiales** | Gestión de configuraciones de predicciones especiales. Crear, editar, eliminar tipos de predicción. **Resolver** predicciones: seleccionar el resultado real (equipo o jugador) y el sistema evalúa automáticamente todas las predicciones de los usuarios. |
| **Configuración** | Configurar puntos base (resultado exacto, ganador correcto), multiplicadores por fase (7 fases) y distribución de premios. **Se bloquea automáticamente 1 hora antes del primer partido.** |

**Barra de estadísticas (admin):**
- Total de partidos abiertos.
- Total de partidos bloqueados (pendientes de resultado).
- Total de partidos finalizados.

**Flujo de registro de resultado:**
1. Admin selecciona un partido en estado **bloqueado**.
2. Ingresa goles local y visitante del tiempo reglamentario.
3. Si el resultado es empate (fases eliminatorias), activa toggle de penaltis e ingresa marcador de penaltis.
4. Confirma el resultado.
5. El sistema automáticamente:
   - Marca el partido como **finalizado**.
   - Evalúa **todas** las predicciones de los usuarios para ese partido.
   - Calcula puntos individuales (regulares + penaltis).
   - Actualiza el **RankingMundial** de cada predictor.
   - Recalcula posiciones globales y tendencias.
6. Se muestra resumen: exactos, ganadores correctos, fallos, penaltis exactos, penaltis ganadores, total evaluadas.

**Flujo de resolución de predicción especial:**
1. Admin selecciona una configuración de predicción especial en estado **bloqueada**.
2. Selecciona el resultado real:
   - Para campeón/subcampeón/tercer lugar: selecciona equipo del dropdown.
   - Para máximo goleador: ingresa nombre del jugador.
3. Confirma la resolución.
4. El sistema automáticamente:
   - Marca la configuración como **resuelta**.
   - Evalúa todas las predicciones de usuarios para ese tipo.
   - Otorga puntos a los que acertaron.
   - Actualiza el **RankingEspecial**.
5. Se muestra resumen: total evaluadas, acertadas, fallidas, puntos totales otorgados.

*[Insertar imagen: Panel de administración del Mundial]*

---

### 63. Configuración del Torneo

La configuración del torneo define los parámetros de puntuación y premios de la edición activa.

**Modelo ConfiguracionTorneo:**

| Parámetro | Default | Descripción |
|---|---|---|
| puntos_resultado_exacto | 3 | Puntos por acertar el marcador exacto. |
| puntos_ganador_correcto | 1 | Puntos por acertar solo el ganador. |
| multiplicador_grupos | x1 | Multiplicador para fase de Grupos. |
| multiplicador_16avos | x1.25 | Multiplicador para 16avos. |
| multiplicador_octavos | x1.5 | Multiplicador para Octavos. |
| multiplicador_cuartos | x1.75 | Multiplicador para Cuartos. |
| multiplicador_semifinales | x2 | Multiplicador para Semifinales. |
| multiplicador_tercer_puesto | x2.5 | Multiplicador para Tercer Puesto. |
| multiplicador_final | x3 | Multiplicador para la Final. |
| premio_primer_lugar | 50% | Porcentaje del fondo para el primer lugar. |
| premio_segundo_lugar | 30% | Porcentaje del fondo para el segundo lugar. |
| premio_tercer_lugar | 20% | Porcentaje del fondo para el tercer lugar. |
| fondo_premios | $50,000 | Fondo total de premios. |

**Reglas de bloqueo:**
- La configuración **se bloquea automáticamente** 1 hora antes del primer partido de la edición.
- Una vez bloqueada, no se pueden modificar los puntos ni multiplicadores desde el panel de administración.
- Esto garantiza que las reglas no cambien una vez iniciado el torneo.

**Visualización pública:**
- En la página de inicio del Mundial, la sección **"Cómo funciona"** muestra dinámicamente las reglas de puntuación y multiplicadores desde la configuración del backend.

*[Insertar imagen: Configuración del torneo]*

---

## CAPÍTULO XIII — CASOS DE USO

### CU-01: Inicio de Sesión
| Campo | Descripción |
|---|---|
| **ID** | CU-01 |
| **Nombre** | Inicio de sesión en el sistema |
| **Descripción** | El usuario accede al sistema ingresando sus credenciales de autenticación |
| **Actor principal** | Todos los usuarios |
| **Actores secundarios** | N/A |
| **Precondiciones** | El usuario debe tener credenciales registradas en el sistema. El sistema debe estar disponible y accesible. |
| **Flujo principal** | 1. El usuario accede a la URL del sistema. 2. Se muestra la página de inicio de sesión. 3. El usuario ingresa su nombre de usuario (cédula). 4. El usuario ingresa su contraseña. 5. Hace clic en el botón "Iniciar Sesión". 6. El sistema valida las credenciales contra el backend. 7. Se genera un token JWT. 8. Se almacena el token en localStorage. 9. Se redirige al Home (Mis Capacitaciones). 10. Se muestra un mensaje de bienvenida (opcional). |
| **Flujos alternativos** | 6a. Si las credenciales son incorrectas: Se muestra mensaje "Usuario o contraseña incorrectos" y se limpia el campo de contraseña. El usuario permanece en la página de login. 7a. Si hay error de conexión: Se muestra mensaje "Error de conexión. Intente nuevamente." |
| **Excepciones** | Acceso denegado si el usuario está desactivado. Error 500 si hay falla en el backend. |
| **Postcondiciones** | El usuario tiene una sesión activa. Token JWT almacenado en localStorage. Se puede acceder a todas las funcionalidades según el rol. |
| **Notas técnicas** | Se usa autenticación basada en JWT. El token tiene un tiempo de expiración configurable. Si el token expira, se redirige automáticamente al login. |

---

### CU-02: Ver Mis Capacitaciones
| Campo | Descripción |
|---|---|
| **ID** | CU-02 |
| **Nombre** | Visualizar capacitaciones asignadas |
| **Descripción** | El usuario accede a su home y visualiza todas las capacitaciones que le han sido asignadas, con su progreso actual |
| **Actor principal** | Todos los usuarios autenticados (Rol 0, 1, 3, 4) |
| **Precondiciones** | Sesión activa. El usuario debe tener al menos una capacitación asignada. |
| **Flujo principal** | 1. El usuario accede al Home (Mis Capacitaciones). 2. El sistema carga las capacitaciones asignadas al usuario. 3. Se muestran como tarjetas con: imagen, título, descripción, barra de progreso y botón "Continuar". 4. Se muestra el porcentaje de avance completado. 5. El usuario puede hacer clic en "Continuar" para acceder a la capacitación. |
| **Flujos alternativos** | 2a. Si no hay capacitaciones asignadas: Se muestra mensaje "No tienes capacitaciones asignadas" con opción de volver al home. 4a. Si la capacitación está 100% completa: Se muestra badge "Completada" y botón "Ver certificado" en lugar de "Continuar". |
| **Excepciones** | Error de carga de capacitaciones. Falta de permisos para ver una capacitación. |
| **Postcondiciones** | El usuario visualiza su lista de capacitaciones con progreso actualizado. Puede seleccionar una para continuar. |
| **Notas técnicas** | El progreso se calcula en base al número de lecciones completadas vs total de lecciones. Las capacitaciones se cargan paginadas (10 por página). |

---

### CU-03: Completar una Lección de Video
| Campo | Descripción |
|---|---|
| **ID** | CU-03 |
| **Nombre** | Completar lección de video |
| **Descripción** | El usuario reproduce un video dentro de una lección y lo marca como completado |
| **Actor principal** | Colaborador (Rol 0) |
| **Precondiciones** | Sesión activa. Capacitación asignada. Lección de tipo video no completada. Acceso a internet. |
| **Flujo principal** | 1. El usuario navega a la capacitación. 2. Expande el módulo correspondiente. 3. Visualiza la lección de video con ícono ▶. 4. Hace clic en "Reproducir". 5. Se abre el reproductor de video (YouTube o servidor local). 6. El video comienza a reproducirse. 7. El usuario ve el video completo. 8. El sistema detecta la finalización del video. 9. El sistema marca la lección como completada. 10. Se actualiza el progreso de la capacitación. 11. El usuario hace clic en "Finalizar lección y volver". |
| **Flujos alternativos** | 5a. Si es video de YouTube: Se embebe usando la API de YouTube. Se espera el evento de "finished" del reproductor. 5b. Si es video local (MP4, WebM): Se usa el reproductor HTML5 nativo. 8a. Si el usuario cierra el reproductor sin completar: Se solicita confirmación antes de salir. La lección NO se marca como completada. |
| **Excepciones** | Error al cargar el video. El video no está disponible. Falta de permisos para reproducir. Conexión a internet interrumpida. |
| **Postcondiciones** | La lección queda marcada como completada (badge ✓). El progreso de la capacitación se actualiza. El usuario puede pasar a la siguiente lección. |
| **Notas técnicas** | Se registra el tiempo de visualización. Se puede configurar si es necesario ver todo el video o solo hasta cierto punto. |

---

### CU-04: Responder Formulario de Evaluación
| Campo | Descripción |
|---|---|
| **ID** | CU-04 |
| **Nombre** | Responder formulario de evaluación |
| **Descripción** | El usuario responde un formulario de evaluación después de completar las lecciones de un módulo |
| **Actor principal** | Colaborador (Rol 0) |
| **Precondiciones** | Sesión activa. Capacitación asignada. Todas las lecciones no-formulario del módulo deben estar completadas. Formulario no completado. |
| **Flujo principal** | 1. El usuario navega a la capacitación. 2. Expande el módulo con el formulario. 3. Visualiza las lecciones completadas (✓) y el formulario (sin completar). 4. Hace clic en "Realizar formulario". 5. Se carga la interfaz del formulario con todas las preguntas. 6. El usuario lee cada pregunta. 7. El usuario selecciona la(s) respuesta(s) correcta(s) (opción única o múltiple). 8. El usuario completa todas las preguntas requeridas. 9. Hace clic en "Enviar respuestas". 10. El sistema valida que todas las preguntas tengan respuesta. 11. El sistema registra las respuestas en la base de datos. 12. Se calcula la puntuación (si aplica). 13. Se muestra mensaje de éxito y se marca la lección como completada. 14. Se actualiza el progreso de la capacitación. |
| **Flujos alternativos** | 3a. Si no ha completado las lecciones previas: El botón "Realizar formulario" está deshabilitado. Se muestra mensaje "Debes completar las lecciones anteriores". 9a. Si no seleccionó respuestas en todas las preguntas: Se muestra error en la pregunta no respondida. No se permite el envío. 12a. Si hay calificación mínima: Si no cumple, se muestra mensaje "Puntuación insuficiente. Intenta nuevamente." El formulario se puede reintentar. |
| **Excepciones** | Error al enviar respuestas. Timeout de sesión. Falta de preguntas definidas. |
| **Postcondiciones** | Las respuestas quedan registradas en la base de datos. La lección se marca como completada. El progreso de la capacitación se actualiza. Si es la última lección, la capacitación se marca como completada. |
| **Notas técnicas** | Las respuestas pueden ser de tipo opción única (radio) o múltiple (checkbox). Se puede permitir reintentos o solo un intento. Se registran el tiempo de respuesta y las respuestas exactas. |

---

### CU-05: Crear una Capacitación
| Campo | Descripción |
|---|---|
| **ID** | CU-05 |
| **Nombre** | Crear una nueva capacitación |
| **Descripción** | Un administrador crea una nueva capacitación con módulos, lecciones, evaluaciones y asignaciones de colaboradores |
| **Actor principal** | Admin Capacitaciones (Rol 1), SuperAdmin (Rol 4) |
| **Precondiciones** | Sesión activa con rol 1 o 4. Permisos de creación de capacitaciones. Cargos y estructura empresarial configurados (para asignaciones). |
| **Flujo principal** | 1. El admin navega a "Gestión de Capacitaciones" → "Crear Capacitación". 2. Se muestra formulario con pestañas: Datos Generales, Módulos/Lecciones, Colaboradores. 3. Pestaña Datos Generales: Ingresa título, descripción, imagen, fecha de inicio, fecha de fin, tipo. 4. Guarda los datos generales. 5. Pestaña Módulos/Lecciones: Agrega módulos (botón ➕). 6. Para cada módulo, agrega lecciones (video, imagen, PDF, formulario). 7. Para lecciones de video: Ingresa URL de YouTube o carga archivo local. 8. Para lecciones de formulario: Agrega preguntas y opciones de respuesta. 9. Define si hay calificación mínima. 10. Pestaña Colaboradores: Selecciona colaboradores a asignar (manual o CSV). 11. Revisa los datos y hace clic en "Crear Capacitación". 12. El sistema crea la capacitación y redirige al listado. |
| **Flujos alternativos** | 2a. Vista asistente paso a paso alternativa si está habilitada. 6a. Si carga archivo local: Se valida formato (MP4, WebM) y tamaño máximo. 10a. Asignación por CSV: Se carga archivo CSV con cédulas de colaboradores. Se valida existencia de cada cédula. 10b. Si alguna cédula no existe: Se muestra advertencia con cédulas no encontradas. El admin puede continuar sin esas cédulas o cancelar. |
| **Excepciones** | Título vacío o duplicado. Formato de imagen inválido. Archivo CSV con formato incorrecto. Falta de colaboradores asignados. Error de almacenamiento de archivos. |
| **Postcondiciones** | La capacitación queda creada en estado "Borrador". Módulos, lecciones y evaluaciones se crean asociados. Colaboradores quedan asignados. La capacitación puede ser editada o activada. |
| **Notas técnicas** | Las capacitaciones se crean en estado Borrador. Deben activarse para que los colaboradores las vean. Se validan todos los campos obligatorios. Se pueden guardar cambios parcialmente. |

---

### CU-06: Gestionar Usuarios
| Campo | Descripción |
|---|---|
| **ID** | CU-06 |
| **Nombre** | Gestionar usuarios del sistema |
| **Descripción** | Un administrador visualiza, crea, edita y elimina usuarios del sistema, además de cambiar sus roles y estados |
| **Actor principal** | Admin Capacitaciones (Rol 1), SuperAdmin (Rol 4) |
| **Actores secundarios** | N/A |
| **Precondiciones** | Sesión activa con rol 1 o 4. **Rol 3 (Admin Exámenes) NO tiene acceso a esta funcionalidad**. |
| **Flujo principal** | 1. El admin navega a "Gestión de Usuarios". 2. Se muestra tabla con listado de usuarios paginado (10 por página). 3. El admin puede buscar por cédula usando el buscador. 4. El admin puede hacer clic en "Ver" para ver el perfil completo del usuario. 5. El admin puede hacer clic en "Editar" para modificar los datos del usuario. 6. El admin puede hacer clic en "Cambiar Estado" para activar/desactivar al usuario. 7. Si es SuperAdmin, puede hacer clic en "Cambiar Rol" para cambiar el tipo de usuario. 8. Se muestra confirmación antes de ejecutar cambios críticos. 9. Los cambios se reflejan inmediatamente en la tabla. |
| **Flujos alternativos** | 3a. Si no hay usuarios que coincidan con la búsqueda: Se muestra "No se encontraron resultados". 4a. Ver perfil completo del usuario con sus capacitaciones, certificados e información personal. 6a. Cambiar estado de usuario: Si está Activo, se desactiva. Si está Inactivo, se activa. Un usuario desactivado no puede acceder al sistema. 7a. Cambiar rol: Solo SuperAdmin. Se ingresa el nuevo rol (0=Usuario, 1=Admin Capacitaciones, 3=Admin Exámenes, 4=SuperAdmin). |
| **Excepciones** | Intento de cambiar rol de un SuperAdmin. Cédula duplicada al crear usuario. Usuario no encontrado. Falta de permisos. |
| **Postcondiciones** | Los cambios en usuario se reflejan en el sistema. Si se desactiva un usuario, pierde acceso al sistema. Si se cambia rol, obtiene nuevos permisos. |
| **Notas técnicas** | Rol 3 está excluido de esta funcionalidad por diseño. Los cambios se registran en auditoría. Se puede crear usuario temporal (Rol 3) o usuario completo (Rol 1) con diferentes campos. |

---

### CU-07: Crear y Enviar Exámenes
| Campo | Descripción |
|---|---|
| **ID** | CU-07 |
| **Nombre** | Crear examen y enviarlo por correo |
| **Descripción** | Un administrador de exámenes crea exámenes ocupacionales y los envía a trabajadores por correo electrónico |
| **Actor principal** | Admin Exámenes (Rol 3), SuperAdmin (Rol 4) |
| **Precondiciones** | Sesión activa con rol 3 o 4. Empresas, cargos y tipos de examen configurados. Servidor de correo disponible. |
| **Flujo principal** | **Parte A: Crear Examen** 1. El admin navega a "Exámenes" → "Crear Examen". 2. Ingresa nombre del examen. 3. Selecciona tipos aplicables (INGRESO, PERIÓDICO, RETIRO, ESPECIAL, POST_INCAPACIDAD). 4. Selecciona empresas donde aplica el examen (búsqueda disponible). 5. Selecciona cargos donde aplica (búsqueda disponible). 6. Hace clic en "Guardar". 7. El examen se crea y se agrega al catálogo. **Parte B: Enviar Examen** 8. El admin navega a "Exámenes" → "Enviar Exámenes". 9. Selecciona empresa, unidad, proyecto, centro operativo (cascada). 10. Selecciona cargo y tipo de examen. 11. Ingresa datos del trabajador (nombre, documento, ciudad). 12. El sistema sugiere exámenes basado en empresa/cargo/tipo. 13. El admin revisa exámenes sugeridos, puede agregar/quitar manualmente. 14. Hace clic en "Enviar". 15. El sistema genera correo con PDF del examen. 16. El correo se envía al trabajador. 17. Se registra el envío en historial. 18. Se muestra confirmación de envío exitoso. |
| **Flujos alternativos** | 9a. Envío masivo: El admin usa la pestaña "Envío Masivo (CSV)". 9a-1. Carga archivo CSV con datos de trabajadores. 9a-2. El sistema valida el formato del CSV. 9a-3. Si hay errores, se muestran las cédulas rechazadas. 9a-4. El admin confirma envío de registros válidos. 9a-5. El sistema envía los correos en background (Celery). 9a-6. Se muestra reporte de envíos exitosos y fallidos. 13a. Si no hay exámenes sugeridos: El admin busca manualmente en el catálogo. |
| **Excepciones** | Correo del trabajador no encontrado. Email no válido. Servidor de correo no disponible. CSV con formato incorrecto. Documento no encontrado en sistema. |
| **Postcondiciones** | Examen se crea en el catálogo. Correo se envía al trabajador. Envío se registra en historial "Reportes de Correos". Se puede generar reporte de envíos. |
| **Notas técnicas** | Se usa Celery + Redis para envío asincrónico de correos. CSV se valida contra formato esperado. Se genera PDF del examen en el servidor. Se almacena UUID único de cada envío para trazabilidad. |

---

### CU-08: Consultar Analíticas
| Campo | Descripción |
|---|---|
| **ID** | CU-08 |
| **Nombre** | Consultar dashboard de analíticas |
| **Descripción** | Un administrador consulta el dashboard con KPIs y estructura organizacional interactiva |
| **Actor principal** | Admin Capacitaciones (Rol 1), SuperAdmin (Rol 4) |
| **Precondiciones** | Sesión activa con rol 1 o 4. Datos de estructura organizacional y capacitaciones configurados. |
| **Flujo principal** | 1. El admin navega a "Analítica". 2. Se carga el dashboard con secciones: **KPIs Principales** y **Estructura Organizacional**. 3. Sección KPIs muestra: - Progreso promedio de capacitaciones (%). - Total de unidades. - Total de proyectos. - Total de centros operativos. 4. Sección Top 5 Proyectos: Muestra los 5 proyectos con mayor progreso. 5. Sección Estructura Organizacional: Árbol interactivo con nodos (Empresa → Unidad → Proyecto → Centro → Colaborador). 6. El admin puede expandir/colapsar nodos para ver detalles. 7. Cada nodo muestra información relevante (nombre, cantidad de elementos, progreso). 8. El admin puede hacer clic en un colaborador para ver su perfil. |
| **Flujos alternativos** | 2a. Si no hay datos: Se muestra mensaje "No hay datos disponibles" con sugerencia de crear capacitaciones. 6a. Si expande un nodo sin datos: Se muestra "Sin elementos". 7a. Al expandir un nodo de centro: Se muestran todos los colaboradores asignados con su progreso individual. |
| **Excepciones** | Error al cargar datos. Estructura organizacional incompleta. Timeout en consulta de datos grandes. |
| **Postcondiciones** | El admin tiene visibilidad completa del progreso de todas las capacitaciones. Puede identificar áreas con bajo progreso. Puede navegar a perfiles individuales de colaboradores. |
| **Notas técnicas** | Los datos se cargan desde el backend con paginación para no sobrecargar. Se pueden agregar filtros por fecha, empresa o proyecto. Los KPIs se calculan en tiempo real o cacheados. |

---

### CU-09: Gestionar Estructura Empresarial
| Campo | Descripción |
|---|---|
| **ID** | CU-09 |
| **Nombre** | Crear y editar estructura empresarial |
| **Descripción** | Un administrador crea y edita la estructura organizacional (Empresas, Unidades, Proyectos, Centros Operativos) |
| **Actor principal** | Admin Exámenes (Rol 3), SuperAdmin (Rol 4) |
| **Precondiciones** | Sesión activa con rol 3 o 4. |
| **Flujo principal** | 1. El admin navega a "Gestión Empresarial" → "Datos de Empresa". 2. Se muestran 4 secciones: Empresas, Unidades, Proyectos, Centros Operativos. 3. **Crear Empresa**: El admin ingresa nombre y NIT. Hace clic en "Guardar". 4. **Crear Unidad**: El admin ingresa nombre, descripción opcional, selecciona empresa(s). Hace clic en "Crear Unidad". Se crea la unidad en cada empresa seleccionada. 5. **Crear Proyecto**: El admin ingresa nombre, selecciona empresa y unidad (cascada). Puede agregar múltiples pares empresa-unidad. Hace clic en "Crear Proyecto". 6. **Crear Centro Operativo**: El admin ingresa nombre, selecciona empresa, unidad, proyecto (cascada). Puede agregar múltiples combinaciones. Hace clic en "Crear Centro". 7. **Editar**: El admin selecciona un elemento, ingresa nuevo nombre, hace clic en "Actualizar". 8. **Asignar Jefe de Proyecto**: El admin selecciona un proyecto y busca un colaborador por cédula. Selecciona colaborador y confirma. |
| **Flujos alternativos** | 4a. Si la unidad se crea en múltiples empresas: Se crea un registro de unidad por cada empresa. 5a. Cascada empresa-unidad: Al seleccionar empresa, se cargan sus unidades. 6a. Cascada empresa-unidad-proyecto: Se filtra según selecciones anteriores. 8a. Búsqueda de jefe de proyecto: Si no se encuentra la cédula, se muestra "Colaborador no encontrado". |
| **Excepciones** | Nombre de empresa/unidad/proyecto vacío o duplicado. Selecciones inválidas en cascada. Colaborador no existe para jefe de proyecto. |
| **Postcondiciones** | Estructura organizacional se actualiza en el sistema. Todos los niveles quedan disponibles para asignación de capacitaciones y exámenes. Jefes de proyecto asignados pueden ser visualizados. |
| **Notas técnicas** | La cascada se implementa con cargas dinámicas del backend. Se validan dependencias (no se puede crear proyecto sin unidad). Se almacenan relaciones many-to-many entre entidades. |

---

### CU-10: Gestionar Datos Maestros (Cargos, Niveles, Regionales)
| Campo | Descripción |
|---|---|
| **ID** | CU-10 |
| **Nombre** | CRUD de datos maestros |
| **Descripción** | Un administrador crea, edita y desactiva registros de cargos, niveles y regionales |
| **Actor principal** | Admin Exámenes (Rol 3), SuperAdmin (Rol 4) |
| **Precondiciones** | Sesión activa con rol 3 o 4. |
| **Flujo principal** | 1. El admin navega a "Gestión Empresarial" → "Cargo, Nivel y Regional". 2. Se muestran 3 pestañas: Cargos, Niveles, Regionales. 3. En cada pestaña hay: **Sección Crear**: Campo "Nombre", botón "Crear". **Sección Editar**: Selector de registro, campo "Nuevo nombre", botón "Actualizar". **Sección Listado**: Tabla con buscador y botón "Desactivar" por registro. 4. Para crear: El admin ingresa el nombre en el campo de texto y hace clic en "Crear". 5. Se muestra mensaje de éxito y se actualiza la tabla de listado. 6. Para editar: El admin selecciona un registro del dropdown, ingresa nuevo nombre, hace clic en "Actualizar". 7. Para desactivar: El admin busca el registro en la tabla, hace clic en "Desactivar". Se solicita confirmación. 8. El registro se marca como inactivo pero no se elimina (trazabilidad). 9. Los registros inactivos ya no aparecen en selectores de formularios. |
| **Flujos alternativos** | 4a. Si el nombre ya existe: Se muestra error "El registro ya existe". 6a. Si intenta actualizar a un nombre existente: Se muestra error de duplicado. 8a. Si el registro está siendo usado en una asignación: Se muestra advertencia pero permite desactivar. |
| **Excepciones** | Nombre vacío. Duplicado de nombre. Intento de desactivar registro en uso. |
| **Postcondiciones** | Datos maestros se crean/actualizan/desactivan en el sistema. Están disponibles para usar en formularios de creación de usuarios y exámenes. |
| **Notas técnicas** | Los datos maestros son compartidos entre múltiples formularios. Se usa soft-delete (inactive flag) en lugar de eliminación física. |

---

### CU-11: Generar Reportes
| Campo | Descripción |
|---|---|
| **ID** | CU-11 |
| **Nombre** | Generar reportes Excel |
| **Descripción** | Un administrador genera reportes en Excel con información de capacitaciones, progreso y correos |
| **Actor principal** | Admin Capacitaciones (Rol 1), Admin Exámenes (Rol 3), SuperAdmin (Rol 4) |
| **Precondiciones** | Sesión activa. Datos disponibles (capacitaciones, colaboradores, correos). |
| **Flujo principal** | **Tipo A: Reporte de Capacitaciones por Rango de Fechas** 1. El admin navega a "Capacitaciones". 2. Hace clic en botón "📊 Generar Reporte". 3. Se abre modal con campos "Fecha de inicio" y "Fecha de fin". 4. Selecciona rango de fechas. 5. Hace clic en "Descargar". 6. El sistema genera Excel con todas las capacitaciones creadas en ese período. 7. Se descarga automáticamente como `reporte_capacitaciones_INICIO_FIN.xlsx`. **Tipo B: Reporte de una Capacitación Individual** 8. El admin navega a una capacitación específica. 9. Hace clic en "Ver Usuarios" o accede desde el listado de capacitaciones. 10. Se abre lista de colaboradores asignados. 11. Hace clic en "Generar Reporte". 12. Se descarga Excel con progreso de cada colaborador en esa capacitación (nombre, % completado, lecciones completadas, fecha de inicio). **Tipo C: Reporte de Correos de Exámenes** 13. El admin navega a "Reportes de Correos". 14. Hace clic en "📥 Generar Excel". 15. Se abre modal con: fecha inicio, fecha fin, selector de empresas. 16. Selecciona filtros. 17. Hace clic en "Descargar". 18. Se descarga Excel `reporte_correos_INICIO_FIN.xlsx` con detalle de todos los correos enviados. |
| **Flujos alternativos** | 4a. Si no selecciona rango de fechas: Se muestra error "Ambas fechas son obligatorias". 4b. Si fecha inicio > fecha fin: Se muestra error "La fecha de inicio debe ser menor o igual a la fecha de fin". 15a. Si no selecciona empresa: Se muestra error "Selecciona al menos una empresa". |
| **Excepciones** | Error en generación de Excel. No hay datos en el rango seleccionado. Timeout en descarga. Archivo corrompido. |
| **Postcondiciones** | Archivo Excel se descarga en el dispositivo del usuario. Puede abrir en Excel, Google Sheets, etc. Contiene información formateada y pronta para análisis. |
| **Notas técnicas** | Se usa librería OpenPyXL o similar en backend para generar Excel. Se genera en background si es muy grande. Se aplican estilos y formatos al Excel (colores, bordes, encabezados). |

---

### CU-12: Ver Perfil del Colaborador (Admin)
| Campo | Descripción |
|---|---|
| **ID** | CU-12 |
| **Nombre** | Consultar perfil y progreso de un colaborador |
| **Descripción** | Un administrador visualiza el perfil completo de un colaborador y su progreso en capacitaciones |
| **Actor principal** | Admin Capacitaciones (Rol 1), SuperAdmin (Rol 4) |
| **Precondiciones** | Sesión activa con rol 1 o 4. Colaborador existe en el sistema. |
| **Flujo principal** | 1. El admin navega a "Gestión de Usuarios". 2. Busca el colaborador o lo selecciona de la tabla. 3. Hace clic en "Ver" en el perfil del usuario. 4. Se abre la vista de perfil del colaborador con pestañas: Capacitaciones, Certificados, Información. 5. Pestaña **Capacitaciones**: Muestra tabla con todas las capacitaciones asignadas, progreso (%), estado (completa/pendiente), fecha de inicio, fecha de finalización. 6. El admin puede hacer clic en una capacitación para ver detalle de módulos/lecciones completadas. 7. Pestaña **Certificados**: Muestra certificados descargados/disponibles con fecha de emisión. 8. Pestaña **Información**: Muestra datos personales (cédula, nombre, apellido, correo, teléfono, cargo, empresa, unidad, proyecto, centro). 9. El admin puede hacer clic en "Volver" para regresar al listado de usuarios. |
| **Flujos alternativos** | 6a. Al hacer clic en capacitación: Se muestra vista similar a "Ver Capacitación" pero solo lectura. Muestra módulos, lecciones con estado de completado (✓ o ○), fechas. 8a. Si algunos datos están vacíos: Se muestra "N/A" o campo en blanco. |
| **Excepciones** | Colaborador no encontrado. Falta de datos en perfil. |
| **Postcondiciones** | El admin tiene visibilidad completa del progreso del colaborador. Puede tomar decisiones sobre reasignación de capacitaciones. |
| **Notas técnicas** | Se cargan datos paginados si hay muchas capacitaciones. Se pueden aplicar filtros por estado en la pestaña de capacitaciones. |

---

### CU-13: Editar Capacitación Existente
| Campo | Descripción |
|---|---|
| **ID** | CU-13 |
| **Nombre** | Editar capacitación existente |
| **Descripción** | Un administrador modifica datos, módulos, lecciones y colaboradores de una capacitación ya creada |
| **Actor principal** | Admin Capacitaciones (Rol 1), SuperAdmin (Rol 4) |
| **Precondiciones** | Sesión activa con rol 1 o 4. Capacitación creada. Estado: Borrador, Activa o Inactiva. |
| **Flujo principal** | 1. El admin navega a "Capacitaciones". 2. Busca o selecciona la capacitación a editar. 3. Hace clic en "Editar" en el menú de acciones. 4. Se abre formulario con pestañas: Datos Generales, Módulos/Lecciones, Colaboradores. 5. Pestaña **Datos Generales**: Se pre-cargan todos los datos actuales (título, descripción, fechas, imagen, tipo). 6. El admin puede modificar cualquier campo. 7. El admin sube una nueva imagen si es necesario. 8. Hace clic en "Guardar Datos Generales". 9. Pestaña **Módulos/Lecciones**: Muestra estructura actual. 10. El admin puede: a) Agregar módulo nuevo (botón ➕). b) Editar nombre de módulo existente. c) Eliminar módulo (con confirmación). d) Agregar lección a módulo. e) Editar lección. f) Eliminar lección. 11. Para agregar/editar lección: Se abre modal con campos tipo video/imagen/PDF/formulario y datos específicos. 12. Pestaña **Colaboradores**: Se muestran colaboradores asignados actuales. 13. El admin puede: a) Buscar nuevos colaboradores (manual o CSV). b) Agregar colaboradores. c) Eliminar colaboradores (con confirmación). 14. Hace clic en "Guardar". 15. Todos los cambios se confirman y se redirige al listado. |
| **Flujos alternativos** | 10c. Si intenta eliminar módulo con lecciones: Se solicita confirmación ("¿Desea eliminar el módulo y todas sus lecciones?"). 13c. Si elimina todos los colaboradores: Se solicita confirmación ("¿Desea desasignar todos los colaboradores?"). Se puede dejar sin colaboradores. 11a. Si es video: Se valida URL de YouTube o archivo local. 11b. Si es imagen: Se valida formato (JPG, PNG) y tamaño. 11c. Si es PDF: Se valida formato y tamaño. 11d. Si es formulario: Se abre interfaz de creación de preguntas/respuestas. |
| **Excepciones** | Nombre de capacitación vacío. Archivo de imagen inválido. Video no accesible. CSV con formato incorrecto. Colaborador que se intenta agregar no existe. |
| **Postcondiciones** | Capacitación queda actualizada con todos los cambios. Los colaboradores nuevos asignados pueden verla si está activa. Los colaboradores eliminados pierden acceso a la capacitación. Historial de cambios se registra (opcional, auditoría). |
| **Notas técnicas** | Validaciones completas en frontend y backend. Se pueden agregar/eliminar múltiples elementos. Los cambios son en tiempo real o se confirman al final (según flujo UX). Se puede guardar como borrador. |

---

### CU-14: Eliminar Capacitación
| Campo | Descripción |
|---|---|
| **ID** | CU-14 |
| **Nombre** | Eliminar capacitación |
| **Descripción** | Un administrador elimina una capacitación completa junto con sus módulos, lecciones y asignaciones |
| **Actor principal** | Admin Capacitaciones (Rol 1), SuperAdmin (Rol 4) |
| **Precondiciones** | Sesión activa con rol 1 o 4. Capacitación creada. |
| **Flujo principal** | 1. El admin navega a "Capacitaciones". 2. Localiza la capacitación a eliminar. 3. Hace clic en el menú de acciones (☰) de la capacitación. 4. Selecciona **"Eliminar"**. 5. Se abre diálogo de confirmación: "¿Desea eliminar esta capacitación y todo su contenido (módulos, lecciones, asignaciones)? Esta acción NO se puede deshacer." 6. El admin hace clic en "Eliminar" para confirmar (o "Cancelar" para abortar). 7. Si confirma, el sistema elimina: - La capacitación - Todos sus módulos - Todas sus lecciones - Todas sus asignaciones de colaboradores - Archivos asociados (videos, imágenes, PDFs) - Respuestas de formularios de colaboradores 8. Se muestra mensaje de éxito: "Capacitación eliminada correctamente." 9. Se redirige al listado de capacitaciones. |
| **Flujos alternativos** | 6a. Si cancela: Se cierra el diálogo y la capacitación permanece en el sistema. 7a. Si hay colaboradores que ya completaron la capacitación: Se muestra advertencia adicional "Esta capacitación ha sido completada por X colaboradores." Se pregunta nuevamente si desea continuar. |
| **Excepciones** | Error al eliminar (falta de permisos, falla de base de datos). Capacitación no encontrada. |
| **Postcondiciones** | La capacitación es eliminada completamente del sistema. Colaboradores pierden acceso a ella. No hay opción de recuperación (eliminación permanente). |
| **Notas técnicas** | Se usa soft-delete o hard-delete según política. Se registra eliminación en auditoría. Se confirma múltiples veces debido a irreversibilidad. Los archivos en servidor se eliminan también. |

---

### CU-15: Cambiar Estado de Capacitación (Activar/Desactivar)
| Campo | Descripción |
|---|---|
| **ID** | CU-15 |
| **Nombre** | Cambiar estado de capacitación (Activar/Desactivar) |
| **Descripción** | Un administrador activa o desactiva una capacitación sin eliminarla, controlando su visibilidad para los colaboradores |
| **Actor principal** | Admin Capacitaciones (Rol 1), SuperAdmin (Rol 4) |
| **Precondiciones** | Sesión activa con rol 1 o 4. Capacitación creada. |
| **Flujo principal** | 1. El admin navega a "Capacitaciones". 2. Visualiza la columna "Estado" con los valores posibles: **Borrador** (gris), **Activa** (verde), **Inactiva** (rojo). 3. El admin identifica la capacitación cuyo estado desea cambiar. 4. Hace clic en el menú de acciones (☰) de la capacitación. 5. Según estado actual: - Si está **Activa**: Selecciona **"Desactivar"**. - Si está **Inactiva**: Selecciona **"Activar"**. - Si está en **Borrador**: Selecciona **"Activar"** para pasar a Activa. 6. Se abre diálogo de confirmación con mensaje descriptivo. 7. El admin confirma la acción. 8. El sistema actualiza el estado en la base de datos. 9. Se muestra mensaje de éxito: "Capacitación [nombre] [activada/desactivada] correctamente." 10. La tabla se actualiza inmediatamente (sin necesidad de recargar página). 11. Los colaboradores ahora [pueden/no pueden] ver la capacitación en su Home según el nuevo estado. |
| **Comportamiento de estados** | - **Borrador**: Visible solo para admins que la crearon. No visible para colaboradores. - **Activa**: Visible para todos los colaboradores asignados. Los colaboradores pueden empezar/continuar. - **Inactiva**: No visible para colaboradores, incluso si estaban trabajando en ella. Los datos se preservan (progreso). |
| **Flujos alternativos** | 5a. Si está en Borrador y el admin selecciona "Desactivar": Se muestra mensaje "No se puede desactivar una capacitación en Borrador. Primero actívala." 11a. Si hay colaboradores actualmente en la capacitación (en progreso): Se muestra advertencia "X colaboradores están actualmente en esta capacitación. ¿Desea continuar?" |
| **Excepciones** | Capacitación no encontrada. Falta de permisos. Error de base de datos. |
| **Postcondiciones** | Estado de capacitación cambia en el sistema. Visibilidad para colaboradores se actualiza. Datos no se pierden, solo se oculta/muestra. |
| **Notas técnicas** | El estado se almacena en campo `status` de modelo Capacitacion. Se valida según transiciones de estado permitidas. Se puede agregar auditoría de cambios de estado. |

---

### CU-16: Descargar Certificado
| Campo | Descripción |
|---|---|
| **ID** | CU-16 |
| **Nombre** | Descargar certificado de capacitación completada |
| **Descripción** | Un colaborador descarga el certificado en PDF al completar una capacitación |
| **Actor principal** | Colaborador (Rol 0) |
| **Precondiciones** | Sesión activa. Capacitación asignada. Capacitación completada al 100%. |
| **Flujo principal** | 1. El colaborador accede a "Mis Capacitaciones". 2. Visualiza la capacitación completada con badge "Completada" (100%). 3. Hace clic en el botón "🏆 Ver Certificado" en lugar de "Continuar". 4. Se abre modal/nueva pestaña mostrando vista previa del certificado en PDF. 5. El certificado contiene: - Nombre del colaborador - Nombre de la capacitación - Empresa/proyecto - Fecha de finalización - Firma digitalizada (si aplica) - Logo de la empresa - Número de certificado único 6. El colaborador hace clic en "📥 Descargar Certificado". 7. Se descarga archivo PDF con nombre `Certificado_[nombre_capacitacion]_[cédula].pdf`. 8. El certificado se marca como "Descargado" en el sistema (registro de descarga). |
| **Flujos alternativos** | 3a. Si la capacitación no está 100% completa: El botón no aparece, solo "Continuar". Se muestra tooltip "Completa todas las lecciones para descargar el certificado." 5a. El certificado se puede pre-generar en background cuando capacitación se completa, o se genera bajo demanda. 8a. Si el certificado ya fue descargado: Se muestra fecha/hora de descarga anterior. |
| **Excepciones** | PDF no se puede generar. Capacitación no está completada. Problemas de permisos. |
| **Postcondiciones** | Archivo PDF se descarga en el dispositivo del usuario. Descarga se registra en sistema. Certificado está disponible para acceso futuro. |
| **Notas técnicas** | Se usa librería ReportLab o similar para generar PDF con datos dinámicos. Se almacena copia del PDF en servidor para descarga futura. Se registra timestamp de descarga para auditoría. |

---

### CU-17: Consultar Historial de Exámenes
| Campo | Descripción |
|---|---|
| **ID** | CU-17 |
| **Nombre** | Consultar historial de exámenes enviados |
| **Descripción** | Un administrador de exámenes visualiza historial de todos los exámenes enviados con detalles de envío |
| **Actor principal** | Admin Exámenes (Rol 3), SuperAdmin (Rol 4) |
| **Precondiciones** | Sesión activa con rol 3 o 4. Exámenes enviados previamente. |
| **Flujo principal** | 1. El admin navega a "Exámenes" → "Reportes de Correos". 2. Se carga tabla con historial de envíos paginado (10 por página). 3. Columnas visibles: UUID, Correos destino, Enviado por, Fecha de envío, Estado (✓ o ✕), Acciones. 4. El admin puede: a) Buscar por UUID del correo (buscador en la cabecera). b) Filtrar por colaborador que envió (dropdown "Enviado por"). 5. Al hacer clic en **"Ver"** en un correo: Se abre modal con detalles completos (ID, UUID, Asunto, Correos, Fecha, Total trabajadores, Cuerpo HTML). 6. Al hacer clic en **"Trabajadores"**: Se navega a vista con tabla de todos los trabajadores del envío (UUID, Nombre, Documento, Cargo, Empresa, Estado). 7. En tabla de trabajadores, el admin puede hacer búsqueda por UUID. 8. El admin puede exportar información usando botón "📥 Generar Excel". 9. Se abre modal para generar reporte: Fecha inicio, Fecha fin, Empresas (selector múltiple). 10. El admin selecciona filtros y hace clic en "Descargar". 11. Se descarga Excel con todos los correos/trabajadores según filtro. |
| **Flujos alternativos** | 4a. Si no hay resultados en búsqueda: Se muestra "No se encontraron resultados". 6a. Si el envío no tiene trabajadores: Se muestra "Sin trabajadores asignados". 9a. Si no selecciona fechas: Se usa período del mes actual por defecto. |
| **Excepciones** | Error al cargar historial. UUID no encontrado. No hay resultados según filtros. |
| **Postcondiciones** | Admin visualiza historial completo de envíos. Puede generar reportes Excel. Puede auditar quién envió qué y cuándo. |
| **Notas técnicas** | Búsqueda por UUID se ejecuta en backend. Filtros se aplican mediante query parameters. Paginación es del servidor. |

---

### CU-18: Buscar Capacitación
| Campo | Descripción |
|---|---|
| **ID** | CU-18 |
| **Nombre** | Buscar capacitación por nombre |
| **Descripción** | Un usuario busca una capacitación específica en su lista de capacitaciones asignadas |
| **Actor principal** | Todos los usuarios autenticados (Rol 0, 1, 3, 4) |
| **Precondiciones** | Sesión activa. Usuario tiene capacitaciones asignadas. |
| **Flujo principal** | 1. El usuario accede a "Mis Capacitaciones" (Home). 2. Se muestra lista de tarjetas de capacitaciones con buscador en la cabecera. 3. El usuario ingresa texto en el campo de búsqueda. 4. Mientras escribe, las tarjetas se filtran en tiempo real. 5. Se muestran solo las capacitaciones cuyo título o descripción coincidan con el texto. 6. El usuario selecciona la capacitación encontrada. 7. Hace clic en "Continuar" para acceder a ella. 8. Se muestra la vista de la capacitación. |
| **Flujos alternativos** | 4a. Si no hay coincidencias: Se muestra mensaje "No se encontraron capacitaciones que coincidan con 'texto'". Se sugiere limpiar el filtro. 4b. Búsqueda es case-insensitive (mayúsculas/minúsculas no importan). 4c. Búsqueda busca en título y descripción. |
| **Excepciones** | Error al cargar capacitaciones. Falta de datos de búsqueda. |
| **Postcondiciones** | Usuario visualiza capacitaciones filtradas. Puede acceder a la capacitación buscada. |
| **Notas técnicas** | Búsqueda se realiza en frontend (in-memory) si hay pocas capacitaciones. Si hay muchas, se puede hacer en backend. Se usa debounce para no saturar búsqueda. |

---

### CU-19: Ver Progreso de Capacitaciones
| Campo | Descripción |
|---|---|
| **ID** | CU-19 |
| **Nombre** | Ver progreso detallado de una capacitación |
| **Descripción** | Un colaborador visualiza el progreso detallado de una capacitación incluyendo módulos y lecciones completadas |
| **Actor principal** | Colaborador (Rol 0) |
| **Precondiciones** | Sesión activa. Capacitación asignada. |
| **Flujo principal** | 1. El colaborador accede a "Mis Capacitaciones". 2. Selecciona una capacitación y hace clic en "Continuar". 3. Se abre vista de "Ver Capacitación". 4. Se muestra: - Título y descripción de capacitación. - Barra de progreso general (% de completado). - Lista de módulos expandibles. 5. Cada módulo muestra: - Nombre del módulo. - Estado visual (completado/en progreso/pendiente). - Contador de lecciones (X de Y completadas). 6. El colaborador expande un módulo haciendo clic en él. 7. Se muestran todas las lecciones del módulo con estado: - ✓ (verde) = Completada. - ○ (gris) = Pendiente. 8. Para cada lección se muestra: - Nombre - Tipo (video, imagen, PDF, formulario, etc.) - Estado. 9. El colaborador puede ver el progreso por lección y por módulo. 10. Al hacer clic en lección completada, puede visualizar contenido nuevamente (re-view). 11. Barra de progreso general se actualiza en tiempo real. |
| **Flujos alternativos** | 6a. Si expande y ve formulario pendiente: Se muestra "Completa las lecciones anteriores para acceder al formulario." Botón deshabilitado. 10a. Si es lección de video: Puede re-reproducir pero no se conta como nuevo completado. 10b. Si es formulario: Puede revisar sus respuestas si ya lo completó. |
| **Excepciones** | Error al cargar progreso. Capacitación no encontrada. Falta de datos. |
| **Postcondiciones** | Usuario visualiza progreso completo de capacitación. Sabe exactamente qué falta por completar. |
| **Notas técnicas** | El progreso se calcula en tiempo real basado en lecciones completadas. Se puede mostrar timestamps de cuándo se completó cada lección. Se puede cachear para mejorar rendimiento. |

---

### CU-20: Realizar Predicción de Partido
| Campo | Descripción |
|---|---|
| **ID** | CU-20 |
| **Nombre** | Realizar predicción del resultado de un partido del Mundial |
| **Descripción** | Un usuario autenticado predice el marcador exacto de un partido del Mundial FIFA, incluyendo opcionalmente penaltis para partidos de eliminación directa |
| **Actor principal** | Todos los usuarios autenticados (Rol 0, 1, 3, 4) |
| **Precondiciones** | Sesión activa. Edición del mundial activa. Partido en estado "abierto". Faltan más de 1 hora para el inicio del partido. |
| **Flujo principal** | 1. El usuario accede a MICampeonato → "Partidos" desde la página de inicio del Mundial. 2. Se muestra la lista de partidos con filtros por fase y grupo. 3. El usuario identifica un partido con estado "⏳ Pendiente" (abierto, sin predicción). 4. Hace clic en la tarjeta del partido para abrir el modal de predicción. 5. **Paso 1 — ¿Quién gana?:** Selecciona Local, Empate o Visitante. 6. **Paso 2 — Marcador exacto:** Usa botones +/- para establecer goles de cada equipo. El sistema valida que el marcador sea coherente con el ganador seleccionado. 7. **Paso 3 — Penaltis (solo si seleccionó empate):** Opcionalmente, activa predicción de penaltis y selecciona marcador de penaltis con botones +/-. Se valida que los penaltis no terminen en empate. 8. El modal muestra los puntos potenciales (ej: "Resultado exacto: 6 pts, Ganador correcto: 2 pts"). 9. El usuario hace clic en "Guardar Predicción". 10. Se envía la predicción al backend (upsert). 11. Se muestra mensaje de éxito y la tarjeta del partido cambia a "✅ Predicción hecha". |
| **Flujos alternativos** | 4a. Si el partido está bloqueado (< 1h antes del inicio): El badge muestra "🔒 Bloqueado" y no se puede hacer clic. 4b. Si el partido ya tiene predicción: El modal se abre con los valores existentes precargados para edición. 5a. En fase de Grupos: La opción "Empate" no está disponible como resultado de penaltis (pero sí como resultado del partido). 7a. Si el usuario no desea predecir penaltis: Puede omitir el paso y guardar solo el resultado de tiempo reglamentario. |
| **Excepciones** | Partido no encontrado. Partido ya bloqueado o finalizado. Error de red al guardar. Validación de marcador incoherente con ganador. |
| **Postcondiciones** | Predicción creada o actualizada en el sistema. Tarjeta del partido muestra badge "Predicción hecha". Estadísticas del usuario se actualizan (partidos predichos). |
| **Notas técnicas** | La predicción usa upsert (crea o actualiza). El bloqueo se valida tanto en frontend (client-side) como en backend (server-side). La fecha de primera predicción del usuario se registra para desempate en ranking. El endpoint es POST `/api/mundial/predicciones/`. |

---

### CU-21: Realizar Predicción Especial
| Campo | Descripción |
|---|---|
| **ID** | CU-21 |
| **Nombre** | Realizar predicción especial del torneo |
| **Descripción** | Un usuario predice eventos especiales del torneo como el campeón, subcampeón, tercer lugar o máximo goleador |
| **Actor principal** | Todos los usuarios autenticados (Rol 0, 1, 3, 4) |
| **Precondiciones** | Sesión activa. Edición activa. Configuración de predicción especial habilitada y en estado "abierta". Fecha límite no superada. |
| **Flujo principal** | 1. El usuario accede a la página de inicio de MICampeonato. 2. Se desplaza a la sección "Predicciones Especiales". 3. Se muestran tarjetas para cada tipo de predicción disponible (Campeón, Subcampeón, Tercer Lugar, Máximo Goleador). 4. Para predicciones de equipo (campeón, subcampeón, tercer lugar): Selecciona un equipo del dropdown con todos los equipos activos. 5. Para predicción de máximo goleador: Ingresa el nombre del jugador en campo de texto. 6. Hace clic en "Guardar Predicción". 7. Se envía al backend y se muestra mensaje de éxito. 8. La tarjeta cambia para mostrar la selección actual con opción de editar (si aún está abierta). |
| **Flujos alternativos** | 3a. Si la fecha límite ya pasó: La tarjeta muestra la predicción del usuario en modo solo lectura. 3b. Si no ha respondido y está cerrada: La tarjeta indica "No participaste en esta predicción". 8a. El usuario puede cambiar su predicción antes de la fecha límite haciendo clic en "Editar". |
| **Excepciones** | Configuración no habilitada. Fecha límite superada. Error al guardar predicción. |
| **Postcondiciones** | Predicción especial creada o actualizada. Visible en la tarjeta correspondiente. |
| **Notas técnicas** | Usa upsert (una predicción por usuario por tipo). Endpoint: POST `/api/mundial/predicciones-especiales/`. Las configuraciones se bloquean automáticamente al pasar la fecha límite. |

---

### CU-22: Consultar Rankings del Mundial
| Campo | Descripción |
|---|---|
| **ID** | CU-22 |
| **Nombre** | Consultar rankings del Mundial |
| **Descripción** | Un usuario consulta las tablas de posiciones del mundial (ranking de partidos y ranking especial) |
| **Actor principal** | Todos los usuarios autenticados (Rol 0, 1, 3, 4) |
| **Precondiciones** | Sesión activa. Al menos un partido finalizado o predicción especial resuelta. |
| **Flujo principal** | 1. El usuario accede a MICampeonato y hace clic en "Ver Ranking Completo" o navega a la ruta `/mundial/ranking`. 2. Se cargan ambos rankings (mundial y especial) en paralelo. 3. **Ranking Mundial:** Se muestra el podio con top 3 (oro, plata, bronce) y tabla completa con todos los participantes. Columnas: posición, avatar, nombre, aciertos exactos, tendencia (↑↓—), puntos totales. 4. **Ranking Especial:** Se muestra lista sin podio con todos los participantes. Columnas: posición, avatar, nombre, aciertos especiales, tendencia, puntos. 5. Si el usuario está en el ranking, su fila se resalta con badge "(Tú)". 6. Si el usuario no aparece en la sección visible, se muestra su posición actual en un bloque separado "📍 Tu Posición". |
| **Flujos alternativos** | 2a. Si no hay datos aún: Se muestra estado vacío con mensaje "Aún no hay datos de ranking. ¡Comienza a hacer predicciones!". |
| **Excepciones** | Error al cargar rankings. Sin datos disponibles. |
| **Postcondiciones** | Usuario visualiza su posición y la de todos los participantes en ambos rankings. |
| **Notas técnicas** | Los rankings se recalculan automáticamente al registrar cada resultado. La tendencia muestra el movimiento respecto a la actualización anterior. Endpoints: GET `/api/mundial/ranking/` y GET `/api/mundial/ranking-especial/`. |

---

### CU-23: Administrar Partidos y Resultados
| Campo | Descripción |
|---|---|
| **ID** | CU-23 |
| **Nombre** | Administrar partidos y registrar resultados del Mundial |
| **Descripción** | Un administrador crea, edita y elimina partidos del torneo, y registra los resultados oficiales de partidos ya jugados |
| **Actor principal** | Admin Capacitaciones (Rol 1), SuperAdmin (Rol 4) |
| **Precondiciones** | Sesión activa con rol 1 o 4. Edición del mundial activa. |
| **Flujo principal** | 1. El admin accede a MICampeonato → "Administración" desde el menú lateral. 2. Se abre el panel de administración con pestañas (Partidos, Resultados, Equipos, Especiales, Configuración). 3. **Crear partido:** Hace clic en "Crear Partido". Selecciona equipo local y visitante, fecha, hora, fase, grupo (si aplica), estado. El multiplicador se asigna automáticamente según la fase. Guarda el partido. 4. **Editar partido:** Hace clic en "Editar" en un partido existente. Modifica datos. Solo editable si está en estado "abierto". 5. **Eliminar partido:** Hace clic en "Eliminar" con confirmación. Solo si no está finalizado. Elimina en cascada las predicciones asociadas. 6. **Registrar resultado:** En pestaña "Resultados", selecciona un partido en estado "bloqueado". Ingresa goles de tiempo reglamentario. Si es empate en eliminación directa: activa penaltis e ingresa marcador de penaltis. Confirma el resultado. 7. El sistema calcula puntos para todas las predicciones, actualiza rankings y muestra resumen (exactos, ganadores, fallos, total evaluadas). |
| **Flujos alternativos** | 4a. Si el partido está bloqueado o finalizado: No se puede editar. 5a. Si el partido está finalizado: No se puede eliminar (tiene predicciones evaluadas). 6a. Si no hay partidos bloqueados: No hay resultados por registrar. |
| **Excepciones** | Partido no encontrado. Estado no permite la operación. Error al calcular puntos. |
| **Postcondiciones** | Partido creado/editado/eliminado. Al registrar resultado: partido finalizado, predicciones evaluadas, rankings actualizados. |
| **Notas técnicas** | Crear partido: POST `/api/mundial/partidos/`. Registrar resultado: POST `/api/mundial/partidos/<id>/resultado/`. La evaluación de predicciones es atómica (transacción). El resumen devuelto incluye: exactos, ganadores, fallos, penaltis_exactos, penaltis_ganadores, total_evaluadas. |

---

### CU-24: Configurar Torneo
| Campo | Descripción |
|---|---|
| **ID** | CU-24 |
| **Nombre** | Configurar parámetros del torneo del Mundial |
| **Descripción** | Un administrador configura los parámetros de puntuación, multiplicadores y premios del torneo |
| **Actor principal** | Admin Capacitaciones (Rol 1), SuperAdmin (Rol 4) |
| **Precondiciones** | Sesión activa con rol 1 o 4. Edición activa. Configuración no bloqueada (más de 1 hora antes del primer partido). |
| **Flujo principal** | 1. El admin accede al panel de administración del Mundial → pestaña "Configuración". 2. Modifica los parámetros de puntuación: puntos por resultado exacto (default 3), puntos por ganador correcto (default 1). 3. Modifica los multiplicadores por fase: Grupos (x1), 16avos (x1.25), Octavos (x1.5), Cuartos (x1.75), Semifinales (x2), Tercer Puesto (x2.5), Final (x3). 4. Configura la distribución de premios: 1er lugar (50%), 2do lugar (30%), 3er lugar (20%), fondo total. 5. Guarda la configuración. |
| **Flujos alternativos** | 2a. Si la configuración está bloqueada (< 1h antes del primer partido): Los campos están deshabilitados. Se muestra mensaje indicando que la configuración fue bloqueada al iniciar el torneo. |
| **Excepciones** | Configuración bloqueada. Error al guardar. Valores inválidos. |
| **Postcondiciones** | Parámetros de puntuación actualizados. Se aplican a todas las evaluaciones futuras. Visibles públicamente en sección "Cómo funciona". |
| **Notas técnicas** | Endpoint: PUT `/api/mundial/configuracion/`. La configuración está ligada 1-a-1 con la edición activa. El bloqueo se verifica en el backend. Los multiplicadores se muestran públicamente en la sección ScoringRulesGrid de la página de inicio del Mundial. |

---

## CAPÍTULO XIV — CONVENCIONES E ÍCONOS

### Íconos utilizados en el sistema:

| Ícono | Nombre | Descripción |
|---|---|---|
| ☰ | Menú / Acciones | Abre el menú de acciones o el sidebar. |
| 👤 | Usuario | Icono de usuario en la barra de navegación. |
| 📊 | Reporte / Analítica | Generación de reportes o sección de analíticas. |
| 📚 | Capacitaciones | Indicador de capacitaciones. |
| ✅ | Completado | Indica elemento completado. |
| 🏆 | Certificado | Indicador de certificados obtenidos. |
| ✓ | Lección completada | Marca de verificación en lecciones. |
| ○ | Lección pendiente | Círculo vacío en lecciones por completar. |
| ▶ | Continuar/Reproducir | Botón para continuar capacitación o reproducir video. |
| ➕ | Agregar | Agregar elemento a una lista. |
| ✕ | Eliminar/Cerrar | Eliminar elemento o cerrar modal. |
| ← | Volver | Navegar a la página anterior. |
| 💼 | Unidad | Nodo de unidad en estructura organizacional. |
| 📁 | Proyecto | Nodo de proyecto en estructura organizacional. |
| 🎯 | Centro Operativo | Nodo de centro en estructura organizacional. |
| 📤 | Envío masivo | Envío masivo por CSV. |
| 🏅 | Medalla | Certificado de logro. |
| ⚽ | Fútbol/Mundial | Módulo MICampeonato. |
| 🏆 | Trofeo/Ranking | Rankings del mundial, primer lugar. |
| 🎯 | Diana/Predicción | Predicciones de partidos. |
| ⭐ | Estrella | Predicciones especiales. |
| 🔒 | Bloqueado | Partido o configuración bloqueada. |
| ⏳ | Pendiente | Predicción pendiente de un partido. |
| ✅ | Predicción hecha | Partido con predicción registrada. |
| ↗️ / ↘️ / — | Tendencia | Subida, bajada o sin cambio en ranking. |

### Badges de estado:

| Badge | Color | Significado |
|---|---|---|
| Activa / Activo | Verde | Registro activo/habilitado. |
| Inactiva / Inactivo | Rojo | Registro desactivado. |
| Borrador | Gris | Registro en estado borrador. |
| Capacitación completada | Gris | La capacitación fue completada al 100%. |
| Capacitación desactivada | Rojo/Gris | La capacitación está inactiva. |
| Abierto (Mundial) | Verde | Partido abierto a predicciones. |
| Bloqueado (Mundial) | Amarillo/Naranja | Partido bloqueado (< 1h antes del inicio). |
| Finalizado (Mundial) | Azul/Gris | Partido con resultado registrado. |
| Predicción hecha | Verde | Usuario ya hizo su predicción para este partido. |
| Pendiente | Gris | Partido sin predicción aún. |

---

## CAPÍTULO XV — CONTROL DE CAMBIOS

| Versión | Fecha | Descripción del Cambio | Responsable |
|---|---|---|---|
| 3.0 | 24/03/2026 | **AGREGADO MÓDULO MICampeonato (MUNDIAL):** Se documentó el módulo completo de predicciones del Mundial FIFA 2026 incluyendo: Capítulo XII-B con 10 secciones (ediciones, equipos, partidos, predicciones, predicciones especiales, sistema de puntuación, rankings, panel de administración, configuración). Se agregaron 5 nuevos casos de uso: CU-20 (Predicción de Partido), CU-21 (Predicción Especial), CU-22 (Rankings), CU-23 (Admin Partidos/Resultados), CU-24 (Configurar Torneo). Se actualizó glosario con 8 nuevos términos. Se agregaron íconos y badges del Mundial. Total de casos de uso: 24. | Equipo de Desarrollo |
| 2.1 | 24/03/2026 | **CORRECCIÓN DE POLÍTICA DE CONTRASEÑAS:** Se eliminó CU-18 (Cambiar Contraseña) ya que el sistema no cuenta con dicha funcionalidad — la contraseña es siempre la cédula del colaborador. Se renumeraron CU-19 y CU-20 a CU-18 y CU-19 respectivamente. Se actualizó sección de Inicio de Sesión con nota sobre política de contraseñas. Total de casos de uso: 19. | Equipo de Desarrollo |
| 2.0 | 24/03/2026 | **ACTUALIZACIÓN INTEGRAL:** Se expandieron todos los casos de uso de 6 a 20 casos completos. Se agregaron CU-16 (Descargar Certificado), CU-17 (Historial Exámenes), CU-18 (Buscar Capacitación), CU-19 (Ver Progreso). Cada caso de uso incluye ahora estructura completa (Descripción, Actores, Precondiciones, Flujo Principal, Flujos Alternativos, Excepciones, Postcondiciones, Notas Técnicas). Se mejoró documentación de módulos con mayor detalle en procesos. Se agregó información de validaciones y comportamientos edge cases. | Equipo de Desarrollo |
| 1.1 | 13/02/2026 | Actualización de permisos: Rol 3 (Admin Exámenes) restringido a solo exámenes y estructura empresarial. Se agregaron 3 nuevos casos de uso: CU-13 (Editar Capacitación), CU-14 (Eliminar Capacitación), CU-15 (Cambiar Estado de Capacitación). | Equipo de Desarrollo |
| 1.0 | 13/02/2026 | Creación del documento de documentación completa del sistema LMS MIConocimiento, basado en el análisis del código fuente del frontend. | Equipo de Desarrollo |

---

> **Nota:** Los espacios marcados con *[Insertar imagen: ...]* están reservados para capturas de pantalla del sistema en funcionamiento. Se recomienda tomar las capturas en un ambiente de pruebas con datos de ejemplo.

---

**"CUALQUIER IMPRESIÓN DE ESTE DOCUMENTO SE CONSIDERA UNA COPIA NO CONTROLADA"**

*El documento original está debidamente firmado por los cargos responsables.*

© 2026 Grupo Empresarial Regency S.A.S. — Sistema MIConocimiento — Todos los derechos reservados.
