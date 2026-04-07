# MANUAL DE USUARIO — Sistema LMS MIConocimiento

**Plataforma de Gestión de Aprendizaje (Learning Management System)**  
**Versión:** 2.0  
**Fecha:** 24 de marzo de 2026  
**Empresa:** Grupo Empresarial Regency S.A.S.

---

## ÍNDICE

- [1. Introducción](#1-introducción)
- [2. Requisitos del Sistema](#2-requisitos-del-sistema)
- [3. Roles del Sistema](#3-roles-del-sistema)
- [4. Acceso al Sistema](#4-acceso-al-sistema)
  - [4.1 Inicio de Sesión](#41-inicio-de-sesión)
  - [4.2 Cierre de Sesión](#42-cierre-de-sesión)
  - [4.3 Política de Contraseñas](#43-política-de-contraseñas)
- [5. Navegación General](#5-navegación-general)
  - [5.1 Barra Superior (Navbar)](#51-barra-superior-navbar)
  - [5.2 Menú Lateral (Sidebar)](#52-menú-lateral-sidebar)
- [6. Guía por Rol — Colaborador (Rol 0)](#6-guía-por-rol--colaborador-rol-0)
  - [6.1 Mis Capacitaciones (Home)](#61-mis-capacitaciones-home)
  - [6.2 Continuar una Capacitación](#62-continuar-una-capacitación)
  - [6.3 Buscar Capacitaciones](#63-buscar-capacitaciones)
  - [6.4 Ver Progreso Detallado](#64-ver-progreso-detallado)
  - [6.5 Reproducir Lección de Video](#65-reproducir-lección-de-video)
  - [6.6 Ver Lección de Imagen o PDF](#66-ver-lección-de-imagen-o-pdf)
  - [6.7 Responder Formulario de Evaluación](#67-responder-formulario-de-evaluación)
  - [6.8 Mi Perfil](#68-mi-perfil)
  - [6.9 Descargar Certificado](#69-descargar-certificado)
- [7. Guía por Rol — Admin Capacitaciones (Rol 1)](#7-guía-por-rol--admin-capacitaciones-rol-1)
  - [7.1 Dashboard de Analítica](#71-dashboard-de-analítica)
  - [7.2 Gestión de Capacitaciones](#72-gestión-de-capacitaciones)
  - [7.3 Crear Capacitación](#73-crear-capacitación)
  - [7.4 Editar Capacitación](#74-editar-capacitación)
  - [7.5 Activar / Desactivar Capacitación](#75-activar--desactivar-capacitación)
  - [7.6 Eliminar Capacitación](#76-eliminar-capacitación)
  - [7.7 Asignar y Editar Colaboradores](#77-asignar-y-editar-colaboradores)
  - [7.8 Ver Progreso de Usuarios por Capacitación](#78-ver-progreso-de-usuarios-por-capacitación)
  - [7.9 Generar Reportes de Capacitaciones](#79-generar-reportes-de-capacitaciones)
  - [7.10 Gestión de Usuarios](#710-gestión-de-usuarios)
  - [7.11 Crear Usuario](#711-crear-usuario)
  - [7.12 Editar Usuario](#712-editar-usuario)
  - [7.13 Cambiar Estado de Usuario](#713-cambiar-estado-de-usuario)
  - [7.14 Registro Masivo de Usuarios (CSV)](#714-registro-masivo-de-usuarios-csv)
- [8. Guía por Rol — Admin Exámenes (Rol 3)](#8-guía-por-rol--admin-exámenes-rol-3)
  - [8.1 Crear y Enviar Exámenes](#81-crear-y-enviar-exámenes)
  - [8.2 Envío Masivo por CSV](#82-envío-masivo-por-csv)
  - [8.3 Reportes de Correos](#83-reportes-de-correos)
  - [8.4 Crear Usuario Temporal](#84-crear-usuario-temporal)
- [9. Guía por Rol — SuperAdmin (Rol 4)](#9-guía-por-rol--superadmin-rol-4)
  - [9.1 Cambiar Rol de Usuario](#91-cambiar-rol-de-usuario)
  - [9.2 Acceso Total al Sistema](#92-acceso-total-al-sistema)
- [10. Gestión Empresarial (Roles 1, 3, 4)](#10-gestión-empresarial-roles-1-3-4)
  - [10.1 Datos de Empresa](#101-datos-de-empresa)
  - [10.2 Gestionar Unidades](#102-gestionar-unidades)
  - [10.3 Gestionar Proyectos](#103-gestionar-proyectos)
  - [10.4 Gestionar Centros Operativos](#104-gestionar-centros-operativos)
  - [10.5 Asignar Jefes de Proyecto](#105-asignar-jefes-de-proyecto)
  - [10.6 Cargo, Nivel y Regional](#106-cargo-nivel-y-regional)
- [11. Módulo MICampeonato — Mundial (Todos los Roles)](#11-módulo-micampeonato--mundial-todos-los-roles)
  - [11.1 Página de Inicio del Mundial](#111-página-de-inicio-del-mundial)
  - [11.2 Cómo Hacer una Predicción de Partido](#112-cómo-hacer-una-predicción-de-partido)
  - [11.3 Predicciones Especiales](#113-predicciones-especiales)
  - [11.4 Ver Rankings](#114-ver-rankings)
  - [11.5 Reglas de Puntuación](#115-reglas-de-puntuación)
  - [11.6 Administración del Mundial (Roles 1, 4)](#116-administración-del-mundial-roles-1-4)
- [12. Lo que el Sistema PUEDE Hacer](#12-lo-que-el-sistema-puede-hacer)
- [13. Lo que el Sistema NO PUEDE Hacer](#13-lo-que-el-sistema-no-puede-hacer)
- [14. Preguntas Frecuentes (FAQ)](#14-preguntas-frecuentes-faq)
- [15. Solución de Problemas Comunes](#15-solución-de-problemas-comunes)

---

## 1. Introducción

**MIConocimiento** es una plataforma web de gestión de aprendizaje (LMS) desarrollada para el Grupo Empresarial Regency S.A.S. Su propósito es administrar, distribuir y dar seguimiento a las capacitaciones, evaluaciones y exámenes ocupacionales de los colaboradores de la empresa.

Este manual le guiará paso a paso por todas las funcionalidades del sistema según su rol asignado.

---

## 2. Requisitos del Sistema

Para utilizar MIConocimiento, necesita:

| Requisito | Detalle |
|---|---|
| **Navegador web** | Google Chrome (recomendado), Mozilla Firefox, Microsoft Edge — versión actualizada. |
| **Conexión a internet** | Conexión estable para carga de videos y archivos multimedia. |
| **Dispositivo** | Computador de escritorio, portátil o tablet. |
| **Credenciales** | Número de cédula (usuario y contraseña). |

> **Nota:** El sistema es una aplicación web. No requiere instalación de software adicional.

---

## 3. Roles del Sistema

El sistema tiene **4 roles** con diferentes niveles de acceso:

| Rol | Código | ¿Qué puede hacer? |
|---|---|---|
| **Colaborador (Usuario)** | 0 | Ver y completar capacitaciones asignadas, ver su perfil, descargar certificados. |
| **Admin Capacitaciones** | 1 | Todo lo del Colaborador + crear/editar/eliminar capacitaciones, gestionar usuarios, ver analíticas, generar reportes, gestionar estructura empresarial. |
| **Admin Exámenes** | 3 | Ver capacitaciones propias + crear y enviar exámenes por correo, ver reportes de correos, crear usuarios temporales, gestionar estructura empresarial. **No** puede gestionar capacitaciones ni usuarios. |
| **SuperAdmin** | 4 | **Acceso total** a todas las funcionalidades del sistema sin restricciones. Puede cambiar roles de otros usuarios. |

---

## 4. Acceso al Sistema

### 4.1 Inicio de Sesión

1. Abra su navegador web e ingrese la **URL del sistema** proporcionada por su empresa.
2. Verá la pantalla de inicio de sesión con el logo de MIConocimiento.
3. En el campo **"Usuario"**, ingrese su **número de cédula**.
4. En el campo **"Contraseña"**, ingrese su **número de cédula** (es la misma).
5. Haga clic en el botón **"Iniciar Sesión"**.
6. Si las credenciales son correctas, será redirigido automáticamente a la página principal (**Mis Capacitaciones**).

**Si ve un mensaje de error:**
- *"Usuario o contraseña incorrectos"*: Verifique que escribió correctamente su número de cédula en ambos campos.
- Si el error persiste, contacte a su administrador para verificar que su cuenta está activa en el sistema.

### 4.2 Cierre de Sesión

1. En la esquina **superior derecha** de la pantalla, haga clic en el **ícono de usuario (👤)** con su nombre.
2. Se desplegará un menú con dos opciones.
3. Haga clic en **"Cerrar sesión"**.
4. Será redirigido a la pantalla de inicio de sesión.

> **Recomendación:** Siempre cierre sesión cuando termine de usar el sistema, especialmente en computadores compartidos.

### 4.3 Política de Contraseñas

⚠️ **IMPORTANTE:**

- La contraseña de cada usuario es **siempre su número de cédula**.
- **No existe** funcionalidad de cambio de contraseña en el sistema.
- Al crear un usuario (de forma individual o masiva), el sistema asigna automáticamente la cédula como contraseña.
- Esta política aplica a **todos los roles** sin excepción.
- Si olvidó su número de cédula o no puede ingresar, contacte a su administrador.

---

## 5. Navegación General

### 5.1 Barra Superior (Navbar)

La barra superior aparece en **todas las páginas** del sistema (excepto login) y contiene:

| Elemento | Ubicación | Función |
|---|---|---|
| **☰ (Hamburguesa)** | Izquierda | Abre o cierra el menú lateral. |
| **"MIConocimiento"** | Centro | Nombre de la plataforma. |
| **👤 Su nombre** | Derecha | Menú desplegable con "Mi Perfil" y "Cerrar sesión". |

### 5.2 Menú Lateral (Sidebar)

El menú lateral se abre con el botón ☰ y muestra las opciones **según su rol**:

**Colaborador (Rol 0):**
| Opción del Menú | Descripción |
|---|---|
| Mis Capacitaciones | Página principal con sus capacitaciones asignadas. |

**Admin Capacitaciones (Rol 1):**
| Sección | Opciones |
|---|---|
| Capacitaciones | Analítica, Capacitaciones, Crear Capacitación, Mis Capacitaciones |
| Usuarios | Gestionar Usuarios, Crear Usuario |
| Gestión Empresarial | Datos de Empresa, Cargo/Nivel/Regional |

**Admin Exámenes (Rol 3):**
| Sección | Opciones |
|---|---|
| Mis Capacitaciones | Ver capacitaciones propias |
| Exámenes | Crear Exámenes, Enviar Exámenes, Reporte de Correos |
| Usuarios | Crear Usuario Temporal |
| Gestión Empresarial | Datos de Empresa, Cargo/Nivel/Regional |

**SuperAdmin (Rol 4):**
| Acceso | Detalle |
|---|---|
| Todas las secciones | Acceso completo a todas las opciones de todos los roles. |

---

## 6. Guía por Rol — Colaborador (Rol 0)

Este es el rol más básico. Como colaborador, usted puede ver y completar las capacitaciones que le han sido asignadas.

### 6.1 Mis Capacitaciones (Home)

Esta es su **página principal** al iniciar sesión.

**Lo que verá:**
- Una cuadrícula de **tarjetas** con todas las capacitaciones que le han asignado.
- Cada tarjeta muestra:
  - Imagen de la capacitación.
  - Título de la capacitación.
  - Barra de progreso con porcentaje (%) completado.
  - Contador de lecciones (ej: "3/5" = 3 lecciones completadas de 5 totales).
  - Botón de acción.

**Estados de las tarjetas:**

| Botón | Color | Significado |
|---|---|---|
| **▶ Continuar** | Azul | Capacitación activa en progreso. Haga clic para seguir. |
| **Capacitación completada** | Verde (deshabilitado) | Usted completó el 100% de las lecciones. |
| **Capacitación desactivada** | Gris (deshabilitado) | La capacitación fue desactivada por un administrador. |

**Si no tiene capacitaciones asignadas**, verá el mensaje: *"No tienes capacitaciones nuevas"*.

### 6.2 Continuar una Capacitación

1. En **Mis Capacitaciones**, haga clic en **"▶ Continuar"** en la tarjeta deseada.
2. Se abrirá la vista de la capacitación con:
   - Título, imagen y descripción de la capacitación.
   - Barra de progreso general.
   - Lista de **módulos** (secciones temáticas).
3. Haga clic en un **módulo** para expandirlo y ver sus lecciones.
4. Cada lección muestra su tipo (video, imagen, PDF, formulario) y estado:
   - **✓** (verde) = Completada.
   - **○** (gris) = Pendiente.
5. Haga clic en el botón de la lección para acceder a su contenido.

### 6.3 Buscar Capacitaciones

1. En la página **Mis Capacitaciones**, ubique el campo de búsqueda en la parte superior.
2. Escriba el nombre de la capacitación que busca.
3. Las tarjetas se filtrarán **en tiempo real** mientras escribe.
4. La búsqueda busca coincidencias en el título y la descripción.
5. No distingue entre mayúsculas y minúsculas.

> Si no hay coincidencias, verá: *"No se encontraron capacitaciones que coincidan con 'texto'"*.

### 6.4 Ver Progreso Detallado

1. Acceda a una capacitación haciendo clic en **"▶ Continuar"**.
2. En la vista de capacitación verá:
   - **Barra de progreso general** con porcentaje total.
   - **Lista de módulos** expandibles.
3. Al expandir cada módulo verá:
   - Nombre del módulo.
   - Contador de lecciones completadas (ej: "2 de 4 completadas").
   - Barra de progreso por módulo.
   - Lista de lecciones con estado individual (✓ completada / ○ pendiente).
4. Para cada lección puede ver: nombre, tipo de contenido y estado.

### 6.5 Reproducir Lección de Video

1. Dentro de una capacitación, expanda el módulo que contiene la lección de video.
2. Haga clic en el botón **"Reproducir"** junto a la lección de video.
3. Se abrirá el **reproductor de video** en pantalla completa.
4. Reproduzca el video completo.
5. Al finalizar la reproducción, la lección se marcará automáticamente como **completada (✓)**.
6. Para volver a la capacitación, haga clic en el botón **"← Volver"**.

> **Nota:** Si vuelve a ver un video ya completado, no se afecta su progreso.

### 6.6 Ver Lección de Imagen o PDF

1. Dentro del módulo, haga clic en **"Ver imagen"** o **"Ver PDF"** según el tipo de lección.
2. Se abrirá un visor con el contenido multimedia.
3. La lección se marca como completada al acceder a ella.
4. Use **"← Volver"** para regresar a la capacitación.

### 6.7 Responder Formulario de Evaluación

Los formularios son lecciones de tipo evaluación con preguntas de opción única o múltiple.

**⚠️ Requisito importante:** Debe completar **todas** las demás lecciones del módulo antes de poder acceder al formulario. Si no las ha completado, el botón estará deshabilitado.

**Pasos:**
1. Dentro del módulo, verifique que todas las lecciones previas estén completadas (✓).
2. Haga clic en **"Realizar formulario"**.
3. Se abrirá el formulario con las preguntas.
4. Para cada pregunta:
   - Lea la pregunta y las opciones.
   - Seleccione la(s) respuesta(s) correcta(s).
   - Las preguntas pueden ser de **opción única** (una sola respuesta) u **opción múltiple** (varias respuestas).
5. Al responder todas las preguntas, haga clic en **"Enviar respuestas"**.
6. El sistema mostrará su resultado.
7. La lección se marca como completada.

### 6.8 Mi Perfil

1. Haga clic en su **nombre** en la esquina superior derecha de la barra de navegación.
2. Seleccione **"Mi Perfil"** del menú desplegable.
3. Verá su información personal organizada en tres pestañas:

**Pestaña "Capacitaciones":**
- Tarjetas con cada capacitación asignada, su progreso y estado.
- Puede hacer clic en "Continuar" para acceder directamente.

**Pestaña "Certificados":**
- Lista de capacitaciones completadas al 100%.
- Cada certificado muestra: nombre de la capacitación, fecha de completado, número de certificado (CERT-000XXX).
- Botón **"Generar PDF"** para descargar el certificado.

**Pestaña "Información":**
- Datos personales: Empresa, Centro de Operación, Regional, Proyecto, Unidad, Nivel.

**Barra de estadísticas:**
- Total de capacitaciones asignadas.
- Capacitaciones completadas.
- Certificados disponibles.

> **Nota:** Usted **no puede** editar su información personal desde el perfil. Debe contactar a un administrador si requiere cambios.

### 6.9 Descargar Certificado

1. Acceda a **Mi Perfil**.
2. Seleccione la pestaña **"Certificados"**.
3. Ubique la capacitación completada de la cual desea el certificado.
4. Haga clic en el botón **"Generar PDF"**.
5. Se descargará un archivo PDF con su certificado.

> Solo puede descargar certificados de capacitaciones completadas al **100%**.

---

## 7. Guía por Rol — Admin Capacitaciones (Rol 1)

Como Admin de Capacitaciones, usted tiene acceso a todo lo que puede hacer un Colaborador, **más** las funcionalidades de administración de capacitaciones, usuarios y analíticas.

### 7.1 Dashboard de Analítica

1. En el menú lateral, haga clic en **"Analítica"** (dentro de la sección Capacitaciones).
2. Se abrirá el panel de analíticas con:

**KPIs principales (tarjetas superiores):**
- **Progreso Promedio:** Porcentaje promedio de avance de todas las capacitaciones.
- **Total Unidades:** Cantidad de unidades organizacionales.
- **Total Proyectos:** Cantidad de proyectos registrados.

**Top Proyectos:**
- Lista de los 5 proyectos con mayor porcentaje de completado.

**Árbol Organizacional:**
- Estructura jerárquica expandible: **💼 Unidad → 📁 Proyecto → 🎯 Centro Operativo**.
- Cada nodo muestra su barra de progreso individual.
- Haga clic en un nodo para expandir o contraer sus hijos.

### 7.2 Gestión de Capacitaciones

1. En el menú lateral, haga clic en **"Capacitaciones"**.
2. Verá una tabla con todas las capacitaciones del sistema:

| Columna | Descripción |
|---|---|
| Título | Nombre de la capacitación. |
| Descripción | Breve descripción. |
| Fecha creación | Cuándo fue creada. |
| Colaboradores | Cantidad de usuarios asignados. |
| Completados | Cantidad que terminaron al 100%. |
| % Completado | Porcentaje promedio de avance. |
| Fecha Inicio / Fin | Período de vigencia. |
| Estado | Badge: Activa (verde), Inactiva (rojo), Borrador (gris). |
| Acciones | Menú ☰ con opciones. |

**Acciones disponibles (menú ☰ de cada fila):**

| Acción | Qué hace |
|---|---|
| **Ver** | Navega a la vista de usuarios/progreso de la capacitación. |
| **Editar** | Abre el editor de capacitación con los datos existentes. |
| **Editar colaboradores** | Permite agregar o quitar colaboradores asignados. |
| **Activar / Desactivar** | Cambia el estado de visibilidad para colaboradores. |
| **Eliminar** | Elimina la capacitación del sistema (irreversible). |

**Búsqueda y paginación:**
- Use el campo de búsqueda para filtrar por título.
- La tabla está paginada (5 capacitaciones por página).

### 7.3 Crear Capacitación

1. Haga clic en **"Crear Capacitación"** en el menú lateral o en el botón **"+ Crear Capacitación"** de la lista.
2. Complete el formulario principal:

| Campo | Descripción | Obligatorio |
|---|---|---|
| Título | Nombre de la capacitación. | ✅ Sí |
| Descripción | Texto descriptivo del contenido. | ✅ Sí |
| Imagen | Imagen de portada (JPG/PNG, máx. 5MB). | No |
| Fecha inicio | Fecha de inicio de la capacitación. | ✅ Sí |
| Fecha fin | Fecha de finalización. | ✅ Sí |
| Tipo | Categoría de capacitación (ej: "CONOCIMIENTOS ORGANIZACIONALES", "INDUCCIÓN CORPORATIVA", etc.). | ✅ Sí |

3. **Agregar módulos:** Haga clic en "Agregar módulo". Ingrese el nombre del módulo.
4. **Agregar lecciones a cada módulo:** Dentro de cada módulo, haga clic en "Agregar lección" y complete:

| Campo | Descripción |
|---|---|
| Título | Nombre de la lección. |
| Descripción | Descripción de la lección. |
| Duración | Duración estimada. |
| Tipo | video, imagen, pdf, o formulario. |
| Archivo/URL | Suba el archivo (imagen/PDF) o ingrese la URL (video). |

5. **Para lecciones tipo formulario:** Se habilita el constructor de preguntas:
   - Agregue preguntas con texto y opcionalmente una imagen.
   - Agregue opciones de respuesta (texto + imagen opcional).
   - Marque la(s) respuesta(s) correcta(s).
   - El sistema detecta automáticamente si es opción única o múltiple.

6. **Asignar colaboradores:** Suba un archivo CSV con los colaboradores a asignar. El formato del CSV se indica en la interfaz.

7. Haga clic en **"Crear Capacitación"** para finalizar.

> **Nota:** El formulario guarda su progreso automáticamente en el navegador (localStorage). Si cierra la página accidentalmente, su progreso no se perderá.

### 7.4 Editar Capacitación

1. En la lista de capacitaciones, haga clic en **☰ → Editar** en la fila de la capacitación deseada.
2. Se abrirá el mismo formulario de creación, pero con todos los datos cargados.
3. Modifique los campos necesarios (título, descripción, módulos, lecciones, etc.).
4. Haga clic en **"Actualizar Capacitación"** para guardar los cambios.

### 7.5 Activar / Desactivar Capacitación

1. En la lista de capacitaciones, haga clic en **☰ → Activar** o **☰ → Desactivar**.
2. Se mostrará un mensaje de confirmación.
3. Confirme la acción.

**Efecto:**
- **Desactivar:** La capacitación dejará de ser visible para los colaboradores asignados. Los datos y progreso **no se eliminan**.
- **Activar:** La capacitación vuelve a ser visible para los colaboradores.

> ⚠️ No se puede desactivar una capacitación en estado "Borrador". Primero debe activarla.

> Si hay colaboradores con capacitación en progreso al desactivar, se mostrará una advertencia indicando cuántos se verán afectados.

### 7.6 Eliminar Capacitación

1. En la lista, haga clic en **☰ → Eliminar**.
2. Se mostrará un diálogo de confirmación.
3. Confirme la eliminación.

> ⚠️ **ADVERTENCIA:** La eliminación es **IRREVERSIBLE**. Se perderán todos los datos de la capacitación, incluyendo módulos, lecciones, progreso de colaboradores y archivos asociados.

### 7.7 Asignar y Editar Colaboradores

**Asignar colaboradores al crear:**
- Durante la creación de una capacitación, suba un archivo CSV con los datos de los colaboradores.

**Editar colaboradores existentes:**
1. En la lista de capacitaciones, haga clic en **☰ → Editar colaboradores**.
2. Se abrirá la vista de asignación.
3. Puede:
   - **Buscar** colaboradores por cédula para agregarlos.
   - **Eliminar** colaboradores de la asignación haciendo clic en el botón de quitar.
4. Los cambios se guardan automáticamente.

### 7.8 Ver Progreso de Usuarios por Capacitación

1. En la lista de capacitaciones, haga clic en **☰ → Ver**.
2. Se abrirá una tabla con todos los colaboradores asignados y su progreso individual.
3. Para cada colaborador puede ver:
   - Nombre, cédula, cargo.
   - Porcentaje de avance.
   - Lecciones completadas vs totales.
4. Haga clic en un colaborador para ver su perfil detallado con progreso por lección.

### 7.9 Generar Reportes de Capacitaciones

1. En la lista de capacitaciones, haga clic en el botón **"📊 Generar Reporte"**.
2. Se abrirá un modal con filtros:
   - **Fecha inicio:** Fecha desde la cual generar el reporte.
   - **Fecha fin:** Fecha hasta la cual generar el reporte.
3. Seleccione el rango de fechas.
4. Haga clic en **"Descargar"**.
5. Se descargará un archivo **Excel (.xlsx)** con los datos de capacitaciones y progreso según el período seleccionado.

### 7.10 Gestión de Usuarios

1. En el menú lateral, haga clic en **"Gestionar Usuarios"**.
2. Verá una tabla con todos los usuarios del sistema:

| Columna | Descripción |
|---|---|
| Cédula | Número de identificación. |
| Nombre | Nombre del colaborador. |
| Apellido | Apellido del colaborador. |
| Correo | Correo electrónico. |
| Cargo | Cargo asignado. |
| Cap. Totales | Total de capacitaciones asignadas. |
| Cap. Completadas | Capacitaciones completadas al 100%. |
| Estado | Activo (verde) / Inactivo (rojo). |
| Acciones | Menú ☰ con opciones. |

**Acciones disponibles (menú ☰):**

| Acción | Qué hace | Rol requerido |
|---|---|---|
| **Ver** | Abre el perfil del colaborador con todo su progreso. | Rol 1, 4 |
| **Editar** | Permite editar datos del colaborador. | Rol 1, 4 |
| **Cambiar Estado** | Activa o desactiva al usuario. | Rol 1, 4 |
| **Cambiar Rol** | Cambia el rol del usuario (solo SuperAdmin). | Solo Rol 4 |

**Búsqueda:** Use el campo de búsqueda para buscar por **cédula**.

**Botones de la cabecera:**
- **📤 Registrar Masivo:** Registro masivo de usuarios por CSV.
- **📊 Descargar Reporte:** Descarga reporte Excel de usuarios.
- **🚫 Desactivar Usuarios:** Navega a la página de desactivación masiva.

### 7.11 Crear Usuario

1. En el menú lateral, haga clic en **"Crear Usuario"**.
2. Complete el formulario:

| Campo | Descripción | Obligatorio |
|---|---|---|
| Cédula | Número de identificación del colaborador. | ✅ Sí |
| Nombre | Nombre del colaborador. | ✅ Sí |
| Apellido | Apellido del colaborador. | ✅ Sí |
| Cargo | Seleccione de la lista de cargos. | ✅ Sí |
| Nivel | Seleccione de la lista de niveles. | ✅ Sí |
| Regional | Seleccione de la lista de regionales. | ✅ Sí |
| Empresa → Unidad → Proyecto → Centro | Selección en cascada de la estructura organizacional. | ✅ Sí |
| Correo | Correo electrónico. | No |
| Teléfono | Número de teléfono. | No |

3. Haga clic en **"Crear Usuario"**.
4. El sistema creará el usuario con:
   - **Usuario:** La cédula ingresada.
   - **Contraseña:** La misma cédula (automático).
   - **Rol:** Colaborador (0) por defecto.

### 7.12 Editar Usuario

1. En la tabla de usuarios, haga clic en **☰ → Editar**.
2. Se abrirá el formulario con los datos actuales del usuario.
3. Modifique los campos necesarios.
4. Haga clic en **"Actualizar"** para guardar.

### 7.13 Cambiar Estado de Usuario

1. En la tabla de usuarios, haga clic en **☰ → Cambiar Estado**.
2. Confirme la acción en el diálogo.
3. El usuario pasará de **Activo → Inactivo** o viceversa.

> Un usuario inactivo **no puede iniciar sesión** en el sistema.

### 7.14 Registro Masivo de Usuarios (CSV)

1. En la gestión de usuarios, haga clic en **"📤 Registrar Masivo"**.
2. Se abrirá un modal con dos modos:
   - **"Registrar Nuevos":** Crea nuevos usuarios a partir del CSV.
   - **"Actualizar Existentes":** Actualiza datos de usuarios ya existentes.
3. Descargue la **plantilla de ejemplo** haciendo clic en el enlace proporcionado.
4. Complete el archivo CSV con los datos de los colaboradores.

**Formato del CSV:**
- Delimitador: punto y coma (`;`).
- La cédula se usa como **usuario y contraseña** automáticamente.

5. Suba el archivo CSV.
6. Haga clic en **"Procesar"**.
7. Si hay errores, se mostrará una tabla con los detalles de cada error por fila.

---

## 8. Guía por Rol — Admin Exámenes (Rol 3)

Como Admin de Exámenes, usted gestiona el envío de exámenes ocupacionales por correo electrónico. También puede ver sus propias capacitaciones como un colaborador regular.

> ⚠️ **Restricción de rol:** El Admin de Exámenes **NO** tiene acceso a: Dashboard de Analítica, Gestión de Capacitaciones, Gestión de Usuarios (solo puede crear usuarios temporales).

### 8.1 Crear y Enviar Exámenes

1. En el menú lateral, haga clic en **"Enviar Exámenes"** o **"Crear Exámenes"**.
2. Complete los selectores en cascada para filtrar:

| Selector | Descripción |
|---|---|
| Empresa | Seleccione la empresa. |
| Unidad | Se filtra según la empresa seleccionada. |
| Proyecto | Se filtra según la unidad seleccionada. |
| Centro Operativo | Se filtra según el proyecto seleccionado. |
| Cargo | Seleccione el cargo del trabajador. |
| Tipo Examen | INGRESO, PERIÓDICO, RETIRO, ESPECIAL, POST_INCAPACIDAD, ALTURAS. |

3. Se mostrarán los **exámenes disponibles** según cargo y tipo seleccionado.
4. Puede agregar o quitar exámenes de la lista manualmente.
5. Complete los datos del trabajador:
   - **Nombre** (solo letras y espacios).
   - **Documento** (solo números).
   - **Ciudad**.
6. Opcionalmente, agregue un **"Solicitante Extra"** buscando por cédula.
7. Haga clic en **"Enviar Exámenes por Correo"**.
8. El sistema enviará el correo con los exámenes a los destinatarios configurados.

### 8.2 Envío Masivo por CSV

1. En la pantalla de exámenes, haga clic en el botón de **envío masivo (📤)**.
2. Se abrirá un modal para cargar un archivo CSV.
3. Descargue la **plantilla** para ver el formato requerido.
4. Complete el CSV con los datos de los trabajadores.
5. Opcionalmente, seleccione un "Solicitante Extra".
6. Suba el archivo y haga clic en **"Enviar"**.
7. El sistema procesará el CSV y enviará los correos de forma masiva.

### 8.3 Reportes de Correos

1. En el menú lateral, haga clic en **"Reporte de Correos"**.
2. Verá una tabla paginada con el historial de todos los envíos:

| Columna | Descripción |
|---|---|
| UUID | Identificador único del envío. |
| Correos destino | Correos a los que se envió. |
| Enviado por | Colaborador que realizó el envío. |
| Fecha de envío | Fecha y hora del envío. |
| Estado | ✓ (exitoso) o ✕ (fallido). |
| Acciones | Ver detalle, Ver trabajadores. |

**Acciones:**
- **"Ver":** Abre modal con detalles completos del envío (ID, UUID, Asunto, Correos, Cuerpo HTML).
- **"Trabajadores":** Navega a tabla de trabajadores del envío (UUID, Nombre, Documento, Cargo, Empresa, Estado).

**Filtros disponibles:**
- Buscar por **UUID** del correo.
- Filtrar por **colaborador** que envió (dropdown "Enviado por").

**Generar reporte Excel:**
1. Haga clic en **"📥 Generar Excel"**.
2. Se abrirá un modal con filtros: Fecha inicio, Fecha fin, Empresas (selector múltiple).
3. Configure los filtros y haga clic en **"Descargar"**.
4. Se descargará un archivo Excel con los datos filtrados.

### 8.4 Crear Usuario Temporal

1. En el menú lateral, haga clic en **"Crear Usuario Temporal"** (dentro de Usuarios).
2. Complete el formulario:

| Campo | Descripción |
|---|---|
| Cédula | Número de identificación. |
| Nombre | Nombre del colaborador. |
| Apellido | Apellido del colaborador. |
| Correo | Correo electrónico. |
| Teléfono | Teléfono de contacto. |
| Inducción | Seleccione la inducción/capacitación a asignar. |

3. Haga clic en **"Crear Temporal"**.
4. El sistema crea el usuario y lo asigna automáticamente a la capacitación (inducción) seleccionada.
5. **Credenciales del usuario temporal:** Usuario = cédula, Contraseña = cédula.

---

## 9. Guía por Rol — SuperAdmin (Rol 4)

El SuperAdmin tiene **acceso total** a todas las funcionalidades del sistema. Todas las guías de los roles anteriores aplican para el SuperAdmin. Adicionalmente, tiene funcionalidades exclusivas:

### 9.1 Cambiar Rol de Usuario

Esta funcionalidad es **exclusiva del SuperAdmin**.

1. Vaya a **Gestionar Usuarios**.
2. En la tabla, busque al usuario deseado.
3. Haga clic en **☰ → Cambiar Rol**.
4. Se mostrará un diálogo (prompt) solicitando el nuevo código de rol:

| Código | Rol resultante |
|---|---|
| 0 | Usuario (Colaborador) |
| 1 | Admin Capacitaciones |
| 3 | Admin Exámenes |
| 4 | SuperAdmin |

5. Ingrese el número del rol y confirme.
6. El rol del usuario se actualiza inmediatamente.

> ⚠️ Use esta funcionalidad con precaución. Asignar el rol 4 (SuperAdmin) otorga acceso total al sistema.

### 9.2 Acceso Total al Sistema

Como SuperAdmin, usted puede:
- Realizar **todas** las funciones de Admin Capacitaciones (Rol 1).
- Realizar **todas** las funciones de Admin Exámenes (Rol 3).
- Cambiar roles de cualquier usuario.
- Crear usuarios completos y temporales.
- Acceder a todos los módulos sin restricciones.

---

## 10. Gestión Empresarial (Roles 1, 3, 4)

Los módulos de gestión empresarial están disponibles para los roles 1 (Admin Capacitaciones), 3 (Admin Exámenes) y 4 (SuperAdmin).

### 10.1 Datos de Empresa

1. En el menú lateral, haga clic en **"Datos de Empresa"** (sección Gestión Empresarial).
2. Verá la interfaz de gestión de la estructura organizacional.

**Crear entidades:**
En la parte superior, seleccione el tipo de entidad a crear:

| Tipo | Campos | Descripción |
|---|---|---|
| **Empresa** | Nombre, NIT | Empresa principal en la jerarquía. |
| **Unidad** | Nombre, Descripción, Empresas (multi-selector) | Unidad dentro de una o más empresas. |
| **Proyecto** | Nombre, Empresa → Unidad (cascada) | Proyecto dentro de una unidad. |
| **Centro Operativo** | Nombre, Empresa → Unidad → Proyecto (cascada) | Centro dentro de un proyecto. |

**Editar entidades:**
1. En la sección de edición, seleccione el tipo (empresa/unidad/proyecto/centro).
2. Use los selectores en cascada para ubicar la entidad.
3. Modifique el nombre.
4. Haga clic en **"Actualizar"**.

**Árbol organizacional:**
- Se muestra la jerarquía completa: Empresa → Unidad → Proyecto → Centro.
- Expanda/contraiga nodos para navegar la estructura.

### 10.2 Gestionar Unidades

1. En **Datos de Empresa**, seleccione tipo **"Unidad"**.
2. Ingrese nombre y descripción.
3. Busque y seleccione las empresas a las que pertenece (selector múltiple con búsqueda).
4. Haga clic en **"Crear"**.

> Se puede asignar una unidad a múltiples empresas. Se creará una unidad por cada empresa seleccionada.

### 10.3 Gestionar Proyectos

1. Seleccione tipo **"Proyecto"**.
2. Seleccione la empresa y luego la unidad (en cascada).
3. Ingrese el nombre del proyecto.
4. Puede seleccionar múltiples unidades para crear el proyecto en varias a la vez.
5. Haga clic en **"Crear"**.

### 10.4 Gestionar Centros Operativos

1. Seleccione tipo **"Centro Operativo"**.
2. Seleccione: Empresa → Unidad → Proyecto (en cascada).
3. Ingrese el nombre del centro.
4. Haga clic en **"Crear"**.

### 10.5 Asignar Jefes de Proyecto

1. En **Datos de Empresa**, busque la sección de **"Jefe de Proyecto"**.
2. Para **asignar** un jefe:
   - Busque al colaborador por cédula.
   - Seleccione de los resultados.
   - Confirme la asignación.
3. Para **cambiar** un jefe existente:
   - Busque al nuevo colaborador.
   - Confirme el cambio.
4. Para **quitar** un jefe:
   - Haga clic en el botón de eliminar junto al jefe actual.
   - Confirme la eliminación.

### 10.6 Cargo, Nivel y Regional

1. En el menú lateral, haga clic en **"Cargo/Nivel/Regional"**.
2. Verá tres pestañas: **Cargos | Niveles | Regionales**.
3. Cada pestaña tiene la misma estructura:

**Crear:**
- Ingrese el nombre del nuevo cargo/nivel/regional.
- Haga clic en **"Crear"**.

**Editar:**
- Seleccione el elemento del dropdown.
- Ingrese el nuevo nombre.
- Haga clic en **"Actualizar"**.

**Desactivar:**
- En la lista de elementos, haga clic en **"Desactivar"** junto al que desea deshabilitar.
- El elemento se desactiva (soft-delete) y no aparecerá en los selectores del sistema.

> **Nota:** La desactivación es un borrado lógico. El elemento no se elimina de la base de datos, solo se oculta.

---

## 11. Módulo MICampeonato — Mundial (Todos los Roles)

**MICampeonato** es el módulo de predicciones deportivas del Mundial FIFA integrado en la plataforma. Todos los colaboradores pueden participar prediciendo resultados de partidos y compitiendo por premios.

**Cómo acceder:** En el menú lateral, busque la sección **"Mi Campeonato"** y haga clic en **"Inicio"**.

### 11.1 Página de Inicio del Mundial

Al acceder al módulo MICampeonato verá las siguientes secciones:

1. **Banner informativo:** Mensaje de bienvenida e invitación a participar.
2. **Hero (cabecera):** Título "Predice. Compite. Gana." con estadísticas generales (participantes, fondo de premios, partidos).
3. **Próximos partidos:** Vista previa de los próximos 6 partidos. Haga clic en **"Ver todos los partidos"** para ir a la página completa.
4. **Predicciones especiales:** Tarjetas para predecir el campeón, subcampeón, tercer lugar y máximo goleador del torneo.
5. **Top 10 Ranking:** Podio de los 3 primeros y tabla de los 10 mejores participantes. Haga clic en **"Ver Ranking Completo"** para ver todos.
6. **Cómo funciona:** Guía de 4 pasos y tabla de puntuación con multiplicadores por fase.

### 11.2 Cómo Hacer una Predicción de Partido

1. Desde el inicio del Mundial, haga clic en **"Ver todos los partidos"** o acceda directamente a `/mundial/partidos`.
2. Verá la lista de **todos los partidos** del torneo organizados por fecha.
3. Puede **filtrar** partidos por:
   - **Fase:** Todos, Grupos, 16avos, Octavos, Cuartos, Semifinales, Tercer Puesto, Final.
   - **Grupo:** A, B, C... L (cuando está en fase de Grupos).
   - **Búsqueda:** Escriba el nombre de un equipo para encontrar sus partidos.

4. **Identifique el estado del partido:**

| Badge | Significado | ¿Puede predecir? |
|---|---|---|
| ⏳ Pendiente | Partido abierto, sin predicción suya. | ✅ Sí |
| ✅ Predicción hecha | Ya hizo su predicción para este partido. | ✅ Sí (puede editar) |
| 🔒 Bloqueado | Falta menos de 1 hora para el inicio. | ❌ No |
| ✔️ Finalizado | Partido ya jugado, resultado registrado. | ❌ No |

5. Haga clic en un partido con estado **⏳ Pendiente** o **✅ Predicción hecha**.
6. Se abrirá el **modal de predicción** con 3 pasos:

**Paso 1 — ¿Quién gana?**
- Seleccione: **Local**, **Empate** o **Visitante**.
- En fase de Grupos, se permite empate. En eliminación directa, el empate lleva a penaltis.

**Paso 2 — Marcador exacto**
- Use los botones **+** y **-** para establecer los goles de cada equipo.
- El marcador debe ser coherente con el ganador que seleccionó.
- El sistema le advierte si hay incoherencia.

**Paso 3 — Penaltis (solo si seleccionó empate en eliminación directa)**
- Puede predecir **opcionalmente** el marcador de penaltis.
- Los penaltis no pueden terminar en empate.
- Este paso es bonus: da puntos adicionales si acierta.

7. El modal muestra los **puntos potenciales** que puede ganar:
   - Resultado exacto: X pts (puntos base × multiplicador de la fase).
   - Ganador correcto: Y pts (puntos base × multiplicador de la fase).

8. Haga clic en **"Guardar Predicción"**.
9. ¡Listo! La tarjeta del partido cambiará a **"✅ Predicción hecha"**.

> **⚠️ IMPORTANTE:** Las predicciones se cierran **1 hora antes** del inicio del partido. ¡No espere al último momento!

> **Editar predicción:** Si ya hizo una predicción y quiere cambiarla, simplemente haga clic en el partido y modifique sus valores antes de que se bloquee.

### 11.3 Predicciones Especiales

Las predicciones especiales le permiten pronosticar eventos del torneo completo:

| Predicción | ¿Qué debe hacer? | Puntos si acierta |
|---|---|---|
| **🏆 Campeón** | Seleccionar qué equipo ganará el mundial. | 50 pts |
| **🥈 Subcampeón** | Seleccionar qué equipo quedará segundo. | 50 pts |
| **🥉 Tercer Lugar** | Seleccionar qué equipo quedará tercero. | 50 pts |
| **⚽ Máximo Goleador** | Escribir el nombre del jugador goleador. | 50 pts |

**Cómo participar:**
1. En la página de inicio del Mundial, desplácese a la sección **"Predicciones Especiales"**.
2. Para predicciones de equipo: Seleccione un equipo del **dropdown**.
3. Para máximo goleador: Escriba el **nombre del jugador**.
4. Haga clic en **"Guardar"**.
5. Puede **editar** su predicción hasta que se cierre la fecha límite.

> Cada predicción especial tiene su propia **fecha límite** independiente. Una vez pasada, su selección queda fija y no se puede cambiar.

### 11.4 Ver Rankings

El módulo tiene **dos rankings** que se actualizan automáticamente cuando se registran resultados:

**Ranking Mundial 🏆** — Basado en predicciones de partidos:
- **Podio:** Top 3 con presentación visual especial (🥇 oro, 🥈 plata, 🥉 bronce).
- **Tabla completa:** Todos los participantes con: posición, nombre, aciertos exactos, tendencia (↑ subió / ↓ bajó / — igual), puntos totales.
- Su fila se resalta con badge **(Tú)**.

**Ranking Especial ✨** — Basado en predicciones especiales:
- Lista de todos los participantes con: posición, nombre, aciertos especiales, tendencia, puntos.

**Cómo acceder:**
- Desde el inicio del Mundial, haga clic en **"Ver Ranking Completo"**.
- O navegue directamente a `/mundial/ranking`.

**Criterios de desempate:** Si dos personas tienen los mismos puntos:
1. Gana quien tenga más **aciertos exactos**.
2. Si persiste el empate, gana quien hizo su **primera predicción más temprano**.

### 11.5 Reglas de Puntuación

**Puntos por predicción de partido:**

| Acierto | Puntos Base | Ejemplo en Semifinal (×2) |
|---|---|---|
| **Resultado exacto** (ej: usted predijo 2-1, real fue 2-1) | 3 pts | 3 × 2 = **6 pts** |
| **Solo ganador correcto** (ej: usted predijo 3-0, real fue 1-0) | 1 pt | 1 × 2 = **2 pts** |
| **Predicción incorrecta** | 0 pts | **0 pts** |

**Bonus por penaltis** (solo si el partido fue a penaltis Y usted predijo penaltis):

| Acierto | Puntos Base | Se suma a los puntos regulares |
|---|---|---|
| Penaltis exactos (ej: predijo 4-3, real 4-3) | +3 pts | × multiplicador de la fase |
| Ganador de penaltis correcto | +1 pt | × multiplicador de la fase |

**Multiplicadores por fase del torneo:**

| Fase | Multiplicador | Resultado exacto → | Ganador correcto → |
|---|---|---|---|
| Grupos | ×1 | 3 pts | 1 pt |
| 16avos | ×1.25 | 3.75 pts | 1.25 pts |
| Octavos | ×1.5 | 4.5 pts | 1.5 pts |
| Cuartos | ×1.75 | 5.25 pts | 1.75 pts |
| Semifinales | ×2 | 6 pts | 2 pts |
| Tercer Puesto | ×2.5 | 7.5 pts | 2.5 pts |
| Final | ×3 | 9 pts | 3 pts |

> **Consejo:** Los partidos de fases avanzadas valen más puntos. ¡No deje de predecir los partidos de semifinales y la final!

### 11.6 Administración del Mundial (Roles 1, 4)

Si usted es **Admin Capacitaciones (Rol 1)** o **SuperAdmin (Rol 4)**, tiene acceso al panel de administración del Mundial.

**Cómo acceder:** En el menú lateral, sección "Mi Campeonato", haga clic en **"Administración"**.

**El panel tiene 5 pestañas:**

**1. Partidos:**
- Crear, editar y eliminar partidos.
- Seleccionar equipos, fecha, hora, fase y grupo.
- El multiplicador se asigna automáticamente según la fase.

**2. Resultados:**
- Seleccionar un partido **bloqueado** (ya jugado).
- Ingresar el marcador del tiempo reglamentario.
- Si hay empate en eliminación directa: activar penaltis e ingresar marcador.
- Al confirmar, el sistema **automáticamente**:
  - Evalúa **todas** las predicciones de los usuarios.
  - Calcula los puntos de cada uno.
  - Actualiza el ranking completo.
  - Muestra resumen (exactos, ganadores correctos, fallos, total evaluadas).

**3. Equipos:**
- Crear equipos con nombre, emoji de bandera e imagen.
- Editar o desactivar equipos existentes.

**4. Especiales:**
- Crear y gestionar configuraciones de predicciones especiales.
- **Resolver** una predicción especial:
  - Seleccionar el equipo ganador o escribir el nombre del goleador.
  - El sistema evalúa todas las predicciones y otorga puntos automáticamente.

**5. Configuración:**
- Editar puntos base (resultado exacto, ganador correcto).
- Editar multiplicadores por cada fase del torneo.
- Configurar distribución de premios.
- ⚠️ **Se bloquea automáticamente 1 hora antes del primer partido.** Después no se puede modificar.

---

## 12. Lo que el Sistema PUEDE Hacer

A continuación se lista un resumen completo de todas las capacidades del sistema:

### Gestión de Capacitaciones
- ✅ Crear capacitaciones con módulos, lecciones multimedia (video, imagen, PDF) y formularios de evaluación.
- ✅ Editar capacitaciones existentes (título, descripción, módulos, lecciones, preguntas).
- ✅ Eliminar capacitaciones.
- ✅ Activar y desactivar capacitaciones.
- ✅ Asignar colaboradores a capacitaciones (individual y masivo por CSV).
- ✅ Editar la lista de colaboradores asignados (agregar/quitar).
- ✅ Monitorear el progreso individual de cada colaborador por capacitación.
- ✅ Generar reportes Excel de capacitaciones por rango de fechas.

### Contenido Multimedia
- ✅ Reproducir videos embebidos dentro de lecciones.
- ✅ Visualizar imágenes (JPG, PNG) dentro de lecciones.
- ✅ Visualizar documentos PDF dentro de lecciones.
- ✅ Formularios de evaluación con preguntas de opción única y múltiple.
- ✅ Soportar preguntas con imágenes adjuntas.
- ✅ Bloqueo de formularios hasta completar lecciones previas del módulo.

### Gestión de Usuarios
- ✅ Crear usuarios individuales (completos y temporales).
- ✅ Registrar usuarios masivamente por CSV.
- ✅ Actualizar usuarios existentes masivamente por CSV.
- ✅ Editar datos de usuarios existentes.
- ✅ Activar y desactivar usuarios.
- ✅ Cambiar roles de usuarios (solo SuperAdmin).
- ✅ Desactivar usuarios masivamente.
- ✅ Descargar reporte Excel de usuarios.
- ✅ Ver perfil detallado de cualquier colaborador (como admin).

### Exámenes Ocupacionales
- ✅ Crear y enviar exámenes ocupacionales por correo electrónico.
- ✅ Enviar exámenes de forma masiva por CSV.
- ✅ Filtrar exámenes por estructura organizacional, cargo y tipo.
- ✅ Consultar historial completo de envíos de correos.
- ✅ Ver detalle de cada envío (destinatarios, asunto, cuerpo, estado).
- ✅ Ver trabajadores asociados a cada envío.
- ✅ Generar reportes Excel de correos enviados (filtrados por fecha y empresa).

### Analíticas
- ✅ Dashboard con KPIs de progreso promedio, unidades y proyectos.
- ✅ Ranking de top 5 proyectos por completado.
- ✅ Árbol organizacional interactivo con progreso por nodo.

### Estructura Organizacional
- ✅ Gestionar empresas (crear, editar).
- ✅ Gestionar unidades (crear, editar, asignar a empresas).
- ✅ Gestionar proyectos (crear, editar, asignar a unidades).
- ✅ Gestionar centros operativos (crear, editar, asignar a proyectos).
- ✅ Asignar, editar y quitar jefes de proyecto.
- ✅ Gestionar cargos, niveles y regionales (crear, editar, desactivar).

### Perfil y Certificados
- ✅ Ver perfil personal con estadísticas.
- ✅ Ver todas las capacitaciones asignadas desde el perfil.
- ✅ Descargar certificados PDF de capacitaciones completadas al 100%.

### MICampeonato (Mundial)
- ✅ Predecir resultados de todos los partidos del Mundial (marcador exacto).
- ✅ Predecir penaltis en partidos de eliminación directa.
- ✅ Editar predicciones antes del bloqueo automático (1 hora antes del partido).
- ✅ Realizar predicciones especiales (campeón, subcampeón, tercer lugar, máximo goleador).
- ✅ Consultar ranking general con podio y tabla completa.
- ✅ Consultar ranking de predicciones especiales.
- ✅ Filtrar partidos por fase, grupo y búsqueda por equipo.
- ✅ Ver puntos potenciales antes de guardar predicción.
- ✅ Sistema de puntuación con multiplicadores por fase del torneo.
- ✅ Crear y administrar partidos del torneo (Admin).
- ✅ Registrar resultados y calcular puntos automáticamente (Admin).
- ✅ Gestionar equipos con bandera e imagen (Admin).
- ✅ Configurar predicciones especiales y resolverlas (Admin).
- ✅ Configurar puntos base, multiplicadores y premios (Admin).
- ✅ Bloqueo automático de configuración antes del primer partido.

### Autenticación y Seguridad
- ✅ Inicio de sesión con autenticación JWT.
- ✅ Control de acceso basado en roles (4 niveles).
- ✅ Redirección automática a "No Autorizado" para rutas sin permisos.
- ✅ Cierre de sesión con limpieza de tokens.

---

## 13. Lo que el Sistema NO PUEDE Hacer

Las siguientes funcionalidades **no están disponibles** en el sistema:

### Contraseñas
- ❌ **Cambiar contraseña.** La contraseña es siempre la cédula del colaborador y no se puede modificar.
- ❌ **Recuperar contraseña.** No existe funcionalidad de "Olvidé mi contraseña" ni restablecimiento por correo.
- ❌ **Políticas de complejidad de contraseña.** No aplican ya que la contraseña es fija (cédula).

### Perfil de Usuario
- ❌ **Editar información personal desde el perfil.** El colaborador no puede cambiar su nombre, correo, teléfono ni datos organizacionales. Solo un administrador puede hacerlo.
- ❌ **Subir foto de perfil.** El avatar se genera automáticamente con las iniciales del nombre.

### Capacitaciones
- ❌ **Auto-inscripción a capacitaciones.** Los colaboradores no pueden inscribirse por cuenta propia. Solo un administrador puede asignarlos.
- ❌ **Comunicación o foros dentro de las capacitaciones.** No hay chat, foros, ni comentarios.
- ❌ **Calificaciones con nota numérica en formularios.** Los formularios evalúan respuestas correctas/incorrectas, pero no generan una calificación con puntaje.
- ❌ **Límite de tiempo para completar lecciones o formularios.** No hay temporizador (timer).
- ❌ **Re-intentar un formulario.** Una vez respondido, no se puede volver a realizar.
- ❌ **Ordenar capacitaciones por prioridad o fecha.** Las capacitaciones se muestran con las incompletas primero, sin más opciones de ordenamiento.

### Exámenes
- ❌ **Rastreo de apertura/lectura de correos enviados.** Se registra el envío, pero no si el destinatario abrió el correo.
- ❌ **Reenvío automático de correos fallidos.** Se debe reenviar manualmente.

### Administración
- ❌ **Eliminar empresas, unidades, proyectos o centros.** Solo se pueden desactivar (soft-delete).
- ❌ **Registro de auditoría detallado.** No hay log de todas las acciones realizadas por cada usuario.
- ❌ **Notificaciones push o por correo electrónico a colaboradores.** No se envían notificaciones sobre nuevas capacitaciones asignadas.
- ❌ **Panel de configuración del sistema.** No hay interfaz para cambiar parámetros del sistema (colores, logotipos, textos, etc.).

### MICampeonato (Mundial)
- ❌ **Predecir después del bloqueo.** Una vez que falta 1 hora para el partido, no se puede crear ni editar predicciones.
- ❌ **Modificar predicciones especiales después de la fecha límite.** Cada predicción especial tiene su propia fecha de cierre.
- ❌ **Cambiar la configuración de puntos después de iniciado el torneo.** Se bloquea automáticamente 1 hora antes del primer partido.
- ❌ **Eliminar resultados ya registrados.** Una vez ingresado un resultado, las puntuaciones se calculan inmediatamente.
- ❌ **Participar sin autenticación.** Se requiere cuenta activa para predecir.

### Técnico
- ❌ **Modo offline.** Requiere conexión a internet permanente.
- ❌ **Aplicación móvil nativa.** Solo se accede mediante navegador web.
- ❌ **Integración con sistemas externos (ERP, HRIS).** No hay APIs de integración con sistemas de terceros.
- ❌ **Multi-idioma.** El sistema está disponible solo en español.

---

## 14. Preguntas Frecuentes (FAQ)

### Acceso

**P: ¿Cuál es mi usuario y contraseña?**  
R: Su usuario y contraseña son ambos su **número de cédula**.

**P: No puedo iniciar sesión, ¿qué hago?**  
R: Verifique que está escribiendo correctamente su cédula en ambos campos. Si aún no puede, contacte a su administrador para verificar que su cuenta esté activa.

**P: ¿Puedo cambiar mi contraseña?**  
R: **No.** El sistema no permite cambiar la contraseña. Su contraseña será siempre su número de cédula.

**P: ¿Puedo acceder desde mi celular?**  
R: Sí, puede acceder desde el navegador de su celular o tablet, aunque se recomienda usar un computador para una mejor experiencia.

### Capacitaciones

**P: ¿Cómo sé qué capacitaciones tengo asignadas?**  
R: Al iniciar sesión, la página principal (Mis Capacitaciones) muestra todas sus capacitaciones asignadas.

**P: ¿Por qué no puedo acceder al formulario de un módulo?**  
R: Debe completar **todas** las demás lecciones del módulo primero (videos, imágenes, PDFs). El formulario se desbloquea al completar las lecciones previas.

**P: ¿Puedo volver a ver un video o PDF ya completado?**  
R: Sí. Puede acceder al contenido de lecciones completadas sin afectar su progreso.

**P: ¿Puedo volver a responder un formulario?**  
R: No. Una vez respondido, puede ver sus respuestas pero no puede re-intentar el formulario.

**P: ¿Dónde descargo mi certificado?**  
R: En **Mi Perfil → Pestaña "Certificados"**. Solo aparecen certificados de capacitaciones completadas al 100%.

**P: Mi capacitación aparece como "desactivada", ¿qué significa?**  
R: Un administrador desactivó la capacitación temporalmente. Su progreso no se pierde. Contacte a su administrador para más información.

### Administración

**P: ¿Cómo le asigno una capacitación a un colaborador?**  
R: Al crear o editar una capacitación, suba un archivo CSV con los colaboradores. También puede ir a ☰ → "Editar colaboradores" de una capacitación existente.

**P: ¿Qué formato debe tener el CSV para registro masivo?**  
R: Descargue la plantilla de ejemplo desde el modal de carga. El delimitador es punto y coma (`;`).

**P: ¿Puedo eliminar un usuario?**  
R: No se eliminan usuarios. Se **desactivan** (estado inactivo). Un usuario desactivado no puede iniciar sesión pero sus datos se conservan.

**P: ¿Cómo cambio el rol de un usuario?**  
R: Solo el **SuperAdmin (Rol 4)** puede cambiar roles. Desde Gestionar Usuarios → ☰ → Cambiar Rol.

### MICampeonato (Mundial)

**P: ¿Hasta cuándo puedo hacer mi predicción para un partido?**  
R: Hasta **1 hora antes** del inicio del partido. Después de eso, la predicción se bloquea automáticamente.

**P: ¿Puedo cambiar una predicción que ya hice?**  
R: Sí, siempre y cuando el partido no esté bloqueado (falte más de 1 hora para el inicio). Haga clic en el partido y modifique sus valores.

**P: ¿Cómo sé si mi predicción fue correcta?**  
R: Cuando un administrador registre el resultado, la tarjeta del partido mostrará el marcador real y sus puntos obtenidos. También puede ver sus puntos en el ranking.

**P: ¿Por qué no puedo editar mi predicción especial?**  
R: La predicción especial tiene su propia fecha límite. Una vez pasada esa fecha, queda fija.

**P: ¿Qué pasa si no predigo un partido?**  
R: Simplemente no obtiene puntos para ese partido. No hay penalización.

**P: ¿Cómo se calculan los puntos?**  
R: Resultado exacto = 3 pts base, solo ganador correcto = 1 pt base. Los puntos se multiplican por un factor según la fase (×1 en Grupos hasta ×3 en la Final). Cada predicción especial acertada vale 50 pts.

**P: ¿Puedo ver el ranking en cualquier momento?**  
R: Sí. El ranking se actualiza automáticamente cada vez que se registra un resultado.

---

## 15. Solución de Problemas Comunes

| Problema | Posible causa | Solución |
|---|---|---|
| "Usuario o contraseña incorrectos" | Cédula mal escrita o usuario inactivo. | Verifique la cédula. Contacte al admin si persiste. |
| La página no carga / queda en blanco | Problema de conexión o caché del navegador. | Verifique su conexión a internet. Limpie la caché del navegador (Ctrl+Shift+Delete). |
| No veo mis capacitaciones | No tiene capacitaciones asignadas o su cuenta no está configurada. | Contacte a su administrador para que le asigne capacitaciones. |
| El video no reproduce | Problema de conexión o formato no soportado. | Verifique su conexión. Intente con otro navegador. |
| No puedo acceder a una sección del menú | Su rol no tiene permisos para esa sección. | Verifique su rol con su administrador. |
| El formulario no se desbloquea | Faltan lecciones previas por completar en el módulo. | Complete todas las lecciones del módulo antes del formulario. |
| Se muestra "No Autorizado" | Intentó acceder a una ruta sin permisos. | Vuelva al Home. Si cree que debería tener acceso, contacte al admin. |
| El certificado no se descarga | Capacitación no completada al 100% o error de generación. | Verifique que completó todas las lecciones. Intente de nuevo. |
| El CSV de registro masivo da errores | Formato incorrecto del archivo. | Descargue la plantilla de ejemplo y siga el formato exacto. Use punto y coma (`;`) como delimitador. |
| Los datos de usuario están desactualizados | Datos no han sido actualizados por un admin. | Contacte a su administrador para actualizar sus datos. |
| No puedo hacer predicción en un partido | El partido ya está bloqueado (falta menos de 1 hora) o ya finalizó. | Solo puede predecir partidos con estado "Pendiente" o editar predicciones existentes antes del bloqueo. |
| Mi predicción no aparece guardada | Error de conexión al guardar o sesión expirada. | Refresque la página e intente nuevamente. Verifique que el partido no se haya bloqueado. |
| No veo el ranking actualizado | El administrador aún no ha registrado resultados. | El ranking se actualiza automáticamente cuando un admin registra el resultado de un partido. |
| No puedo acceder a Administración del Mundial | Su rol no tiene permisos de administrador. | Solo los roles Admin Capacitaciones (1) y SuperAdmin (4) pueden acceder al panel de administración del Mundial. |
| La configuración de puntos está bloqueada | El torneo ya comenzó (primer partido en menos de 1 hora). | La configuración se bloquea automáticamente para garantizar la equidad del torneo. |
| La predicción especial no me deja editar | Pasó la fecha límite de esa predicción especial. | Cada predicción especial tiene su propia fecha de cierre. Una vez pasada, no se puede modificar. |

---

> **Documento elaborado por:** Equipo de Desarrollo — Grupo Empresarial Regency S.A.S.  
> **Última actualización:** 24 de marzo de 2026  
> **Versión:** 2.0

---

**"CUALQUIER IMPRESIÓN DE ESTE DOCUMENTO SE CONSIDERA UNA COPIA NO CONTROLADA"**

© 2026 Grupo Empresarial Regency S.A.S. — Sistema MIConocimiento — Todos los derechos reservados.
    