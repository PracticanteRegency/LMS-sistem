# DOCUMENTACIÓN COMPLETA DEL SISTEMA LMS — MIConocimiento

**Plataforma de Gestión de Aprendizaje (Learning Management System)**  
**Versión:** 1.0  
**Fecha:** 13 de febrero de 2026  
**Empresa:** Grupo Empresarial Regency S.A.S.

---

## ÍNDICE GENERAL

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
- [CAPÍTULO XIII — CASOS DE USO](#capítulo-xiii--casos-de-uso)
- [CAPÍTULO XIV — CONVENCIONES E ÍCONOS](#capítulo-xiv--convenciones-e-íconos)
- [CAPÍTULO XV — CONTROL DE CAMBIOS](#capítulo-xv--control-de-cambios)

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
- **Usuario:** Nombre de usuario (generalmente el número de cédula del colaborador).
- **Contraseña:** Contraseña asignada.

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

## CAPÍTULO XIII — CASOS DE USO

### CU-01: Inicio de Sesión
| Campo | Descripción |
|---|---|
| **ID** | CU-01 |
| **Nombre** | Inicio de sesión en el sistema |
| **Actor principal** | Todos los usuarios |
| **Precondiciones** | El usuario debe tener credenciales registradas. |
| **Flujo principal** | 1. El usuario accede a la URL del sistema. 2. Ingresa usuario y contraseña. 3. Hace clic en "Iniciar Sesión". 4. El sistema valida las credenciales. 5. Se redirige al Home. |
| **Flujo alternativo** | 5a. Si las credenciales son incorrectas, se muestra mensaje de error. |
| **Postcondiciones** | El usuario tiene una sesión activa con token JWT. |

*[Insertar imagen: Diagrama de caso de uso CU-01]*

---

### CU-02: Ver Mis Capacitaciones
| Campo | Descripción |
|---|---|
| **ID** | CU-02 |
| **Nombre** | Visualizar capacitaciones asignadas |
| **Actor principal** | Todos los usuarios autenticados |
| **Precondiciones** | Sesión activa. Tener al menos una capacitación asignada. |
| **Flujo principal** | 1. El usuario accede al Home. 2. Se cargan las capacitaciones asignadas. 3. Se muestran como tarjetas con progreso. 4. El usuario puede hacer clic en "Continuar" para acceder a una capacitación. |
| **Postcondiciones** | El usuario visualiza su progreso en las capacitaciones. |

*[Insertar imagen: Diagrama de caso de uso CU-02]*

---

### CU-03: Completar una Lección de Video
| Campo | Descripción |
|---|---|
| **ID** | CU-03 |
| **Nombre** | Completar lección de video |
| **Actor principal** | Colaborador |
| **Precondiciones** | Sesión activa. Capacitación asignada. Lección no completada. |
| **Flujo principal** | 1. El usuario accede a la capacitación. 2. Expande el módulo correspondiente. 3. Hace clic en "Reproducir". 4. Ve el video completo. 5. El sistema marca la lección como completada. 6. El usuario hace clic en "Finalizar lección y volver". |
| **Flujo alternativo** | 4a. Si es video de YouTube, se usa la API de YouTube. |
| **Postcondiciones** | La lección queda marcada como completada. El progreso se actualiza. |

*[Insertar imagen: Diagrama de caso de uso CU-03]*

---

### CU-04: Responder Formulario de Evaluación
| Campo | Descripción |
|---|---|
| **ID** | CU-04 |
| **Nombre** | Responder formulario de evaluación |
| **Actor principal** | Colaborador |
| **Precondiciones** | Sesión activa. Todas las lecciones no-formulario del módulo completadas. |
| **Flujo principal** | 1. El usuario accede al módulo con el formulario. 2. Hace clic en "Realizar formulario". 3. Lee las preguntas y selecciona respuestas. 4. Hace clic en "Enviar respuestas". 5. El sistema registra las respuestas. 6. Se muestra mensaje de éxito y redirige a la capacitación. |
| **Flujo alternativo** | 2a. Si no ha completado las lecciones previas, el botón está deshabilitado. 4a. Si no seleccionó respuestas, se muestra error. |
| **Postcondiciones** | Las respuestas quedan registradas. La lección se marca como completada. |

*[Insertar imagen: Diagrama de caso de uso CU-04]*

---

### CU-05: Crear una Capacitación
| Campo | Descripción |
|---|---|
| **ID** | CU-05 |
| **Nombre** | Crear una nueva capacitación |
| **Actor principal** | Admin (1), SuperAdmin (4) |
| **Precondiciones** | Sesión activa con rol Admin o SuperAdmin. |
| **Flujo principal** | 1. El admin navega a "Crear Capacitación". 2. Completa los datos generales (título, descripción, fechas, tipo, imagen). 3. Agrega módulos. 4. Agrega lecciones a los módulos (video, imagen, PDF, formulario). 5. Para formularios, agrega preguntas y respuestas. 6. Asigna colaboradores (manualmente o por CSV). 7. Hace clic en "Guardar". 8. La capacitación se crea en el sistema. |
| **Flujo alternativo** | 6a. Si el CSV contiene cédulas no encontradas, se muestra advertencia. |
| **Postcondiciones** | La capacitación queda creada con módulos, lecciones y colaboradores asignados. |

*[Insertar imagen: Diagrama de caso de uso CU-05]*

---

### CU-06: Gestionar Usuarios
| Campo | Descripción |
|---|---|
| **ID** | CU-06 |
| **Nombre** | Gestionar usuarios del sistema |
| **Actor principal** | Admin Capacitaciones (1), SuperAdmin (4) |
| **Precondiciones** | Sesión activa con rol 1 o 4. **Rol 3 no tiene acceso**. |
| **Flujo principal** | 1. El admin navega a "Gestionar Usuarios". 2. Visualiza la tabla de usuarios con búsqueda y paginación. 3. Puede ver perfil, editar datos, cambiar estado o cambiar rol (SuperAdmin). |
| **Postcondiciones** | Los cambios se reflejan en el sistema. |

*[Insertar imagen: Diagrama de caso de uso CU-06]*

---

### CU-13: Editar Capacitación Existente
| Campo | Descripción |
|---|---|
| **ID** | CU-13 |
| **Nombre** | Editar capacitación existente |
| **Actor principal** | Admin Capacitaciones (1), SuperAdmin (4) |
| **Precondiciones** | Sesión activa con rol 1 o 4. Capacitación creada. |
| **Flujo principal** | 1. El admin navega a "Capacitaciones". 2. Hace clic en "Editar" en la capacitación deseada. 3. Se cargan todos los datos actuales (título, descripción, imagen, módulos, lecciones, colaboradores). 4. Modifica los campos necesarios. 5. Agrega o elimina módulos y lecciones si es requerido. 6. Actualiza la lista de colaboradores. 7. Hace clic en "Guardar". 8. Los cambios se reflejan en el sistema. |
| **Postcondiciones** | La capacitación queda actualizada con los nuevos datos. |

*[Insertar imagen: Diagrama de caso de uso CU-13]*

---

### CU-14: Eliminar Capacitación
| Campo | Descripción |
|---|---|
| **ID** | CU-14 |
| **Nombre** | Eliminar capacitación |
| **Actor principal** | Admin Capacitaciones (1), SuperAdmin (4) |
| **Precondiciones** | Sesión activa con rol 1 o 4. Capacitación en estado Borrador, Activa o Inactiva. |
| **Flujo principal** | 1. El admin navega a "Capacitaciones". 2. Hace clic en el menú de acciones (☰) de la capacitación a eliminar. 3. Selecciona **"Eliminar"**. 4. Se muestra un diálogo de confirmación. 5. El admin confirma la eliminación. 6. El sistema elimina la capacitación, sus módulos, lecciones y asignaciones. 7. Se muestra mensaje de éxito. |
| **Flujo alternativo** | 5a. Si el admin cancela, la capacitación no se elimina. |
| **Postcondiciones** | La capacitación es eliminada del sistema. Los colaboradores asignados pierden acceso a ella. |

*[Insertar imagen: Diagrama de caso de uso CU-14]*

---

### CU-15: Cambiar Estado de Capacitación (Activar/Desactivar)
| Campo | Descripción |
|---|---|
| **ID** | CU-15 |
| **Nombre** | Cambiar estado de capacitación (Activar/Desactivar) |
| **Actor principal** | Admin Capacitaciones (1), SuperAdmin (4) |
| **Precondiciones** | Sesión activa con rol 1 o 4. Capacitación creada. |
| **Flujo principal** | 1. El admin navega a "Capacitaciones". 2. Visualiza el estado actual en la columna "Estado" (Activa/Inactiva/Borrador). 3. Hace clic en el menú de acciones (☰) de la capacitación. 4. Selecciona **"Activar"** o **"Desactivar"** según corresponda. 5. Confirma la acción en el diálogo de confirmación. 6. El sistema actualiza el estado. 7. Se muestra mensaje de éxito. |
| **Comportamiento** | - Si está Activa, puede desactivarse. - Si está Inactiva, puede activarse. - Los colaboradores no pueden acceder a capacitaciones desactivadas. |
| **Postcondiciones** | El estado de la capacitación cambia en el sistema. |

*[Insertar imagen: Diagrama de caso de uso CU-15]*

---

### CU-07: Crear y Enviar Exámenes
| Campo | Descripción |
|---|---|
| **ID** | CU-07 |
| **Nombre** | Crear examen y enviarlo por correo |
| **Actor principal** | Admin Exámenes (3), SuperAdmin (4) |
| **Precondiciones** | Sesión activa con rol 3 o 4. Empresas y cargos configurados. |
| **Flujo principal** | 1. El admin crea un examen con nombre, tipos, empresas y cargos. 2. Navega a "Enviar Exámenes". 3. Selecciona empresa, unidad, proyecto, centro, cargo y tipo. 4. Ingresa datos del trabajador. 5. Revisa los exámenes sugeridos y agrega/quita según necesidad. 6. Hace clic en "Enviar". 7. El sistema envía el correo con los exámenes. |
| **Flujo alternativo** | 3a. Envío masivo: sube un archivo CSV y envía a múltiples trabajadores. |
| **Postcondiciones** | El correo se envía y queda registrado en el historial. |

*[Insertar imagen: Diagrama de caso de uso CU-07]*

---

### CU-08: Consultar Analíticas
| Campo | Descripción |
|---|---|
| **ID** | CU-08 |
| **Nombre** | Consultar dashboard de analíticas |
| **Actor principal** | Admin (1), SuperAdmin (4) |
| **Precondiciones** | Sesión activa con rol Admin o SuperAdmin. Datos de estructura organizacional configurados. |
| **Flujo principal** | 1. El admin navega a "Analítica". 2. Visualiza KPIs (progreso promedio, total unidades, total proyectos). 3. Visualiza los proyectos con mayor progreso (Top 5). 4. Explora la estructura organizacional interactiva expandiendo/colapsando nodos. |
| **Postcondiciones** | El admin tiene visibilidad del progreso general. |

*[Insertar imagen: Diagrama de caso de uso CU-08]*

---

### CU-09: Gestionar Estructura Empresarial
| Campo | Descripción |
|---|---|
| **ID** | CU-09 |
| **Nombre** | Crear y editar estructura empresarial |
| **Actor principal** | Admin Exámenes (3), SuperAdmin (4) |
| **Precondiciones** | Sesión activa con rol 3 o 4. |
| **Flujo principal** | 1. El admin navega a "Datos de Empresa". 2. Selecciona el tipo a crear (Empresa, Unidad, Proyecto, Centro). 3. Completa el formulario con datos y asociaciones. 4. Guarda el registro. 5. Puede editar nombres existentes o asignar jefes de proyecto. |
| **Postcondiciones** | La estructura organizacional queda actualizada. |

*[Insertar imagen: Diagrama de caso de uso CU-09]*

---

### CU-10: Gestionar Cargos, Niveles y Regionales
| Campo | Descripción |
|---|---|
| **ID** | CU-10 |
| **Nombre** | CRUD de datos maestros (Cargo, Nivel, Regional) |
| **Actor principal** | Admin Exámenes (3), SuperAdmin (4) |
| **Precondiciones** | Sesión activa con rol 3 o 4. |
| **Flujo principal** | 1. El admin navega a "Cargo, Nivel y Regional". 2. Selecciona la pestaña correspondiente. 3. Puede crear un nuevo registro, editar existentes o desactivar. 4. Usa el buscador para filtrar la lista. |
| **Postcondiciones** | Los datos maestros quedan actualizados. |

*[Insertar imagen: Diagrama de caso de uso CU-10]*

---

### CU-11: Generar Reportes
| Campo | Descripción |
|---|---|
| **ID** | CU-11 |
| **Nombre** | Generar reportes Excel |
| **Actor principal** | Admin (1), Admin Exámenes (3), SuperAdmin (4) |
| **Precondiciones** | Sesión activa con rol correspondiente. |
| **Flujo principal** | 1. El admin accede a la sección de reportes correspondiente. 2. Selecciona filtros (fechas, empresas, etc.). 3. Hace clic en "Descargar" o "Generar". 4. El sistema genera y descarga el archivo Excel. |
| **Tipos de reportes** | a) Reporte de capacitaciones por rango de fechas. b) Reporte de una capacitación individual. c) Reporte de correos de exámenes por fechas y empresas. |
| **Postcondiciones** | Se descarga el archivo Excel en el dispositivo del usuario. |

*[Insertar imagen: Diagrama de caso de uso CU-11]*

---

### CU-12: Ver Perfil del Colaborador (Admin)
| Campo | Descripción |
|---|---|
| **ID** | CU-12 |
| **Nombre** | Consultar perfil y progreso de un colaborador |
| **Actor principal** | Admin (1), SuperAdmin (4) |
| **Precondiciones** | Sesión activa con rol Admin o SuperAdmin. |
| **Flujo principal** | 1. El admin navega a "Gestionar Usuarios". 2. Hace clic en "Ver" en el usuario deseado. 3. Visualiza el perfil completo del colaborador. 4. Puede acceder al detalle de progreso en una capacitación específica. |
| **Postcondiciones** | El admin visualiza el progreso detallado del colaborador. |

*[Insertar imagen: Diagrama de caso de uso CU-12]*

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

### Badges de estado:

| Badge | Color | Significado |
|---|---|---|
| Activa / Activo | Verde | Registro activo/habilitado. |
| Inactiva / Inactivo | Rojo | Registro desactivado. |
| Borrador | Gris | Registro en estado borrador. |
| Capacitación completada | Gris | La capacitación fue completada al 100%. |
| Capacitación desactivada | Rojo/Gris | La capacitación está inactiva. |

---

## CAPÍTULO XV — CONTROL DE CAMBIOS

| Versión | Fecha | Descripción del Cambio | Responsable |
|---|---|---|---|
| 1.1 | 13/02/2026 | Actualización de permisos: Rol 3 (Admin Exámenes) restringido a solo exámenes y estructura empresarial. Se agregaron 3 nuevos casos de uso: CU-13 (Editar Capacitación), CU-14 (Eliminar Capacitación), CU-15 (Cambiar Estado de Capacitación). | Equipo de Desarrollo |
| 1.0 | 13/02/2026 | Creación del documento de documentación completa del sistema LMS MIConocimiento, basado en el análisis del código fuente del frontend. | Equipo de Desarrollo |

---

> **Nota:** Los espacios marcados con *[Insertar imagen: ...]* están reservados para capturas de pantalla del sistema en funcionamiento. Se recomienda tomar las capturas en un ambiente de pruebas con datos de ejemplo.

---

**"CUALQUIER IMPRESIÓN DE ESTE DOCUMENTO SE CONSIDERA UNA COPIA NO CONTROLADA"**

*El documento original está debidamente firmado por los cargos responsables.*

© 2026 Grupo Empresarial Regency S.A.S. — Sistema MIConocimiento — Todos los derechos reservados.
