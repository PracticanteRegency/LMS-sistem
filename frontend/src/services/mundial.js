// ============================================================
//  mundial.js — API Service Layer
//  MICampeonato — Todas las funciones de API para el módulo Mundial
// ============================================================
import api from "./axios";

const BASE = "mundial";

// ===== EDICIONES =====

/** Listar ediciones */
export const getEdiciones = () => api.get(`${BASE}/ediciones/`);

/** Crear edición */
export const createEdicion = (data) => api.post(`${BASE}/ediciones/`, data);

/** Detalle de una edición */
export const getEdicion = (id) => api.get(`${BASE}/ediciones/${id}/`);

// ===== EQUIPOS =====

/** Listar equipos */
export const getEquipos = () => api.get(`${BASE}/equipos/`);

/** Crear equipo */
export const createEquipo = (data) => api.post(`${BASE}/equipos/`, data, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

/** Detalle de un equipo */
export const getEquipo = (id) => api.get(`${BASE}/equipos/${id}/`);

/** Actualizar un equipo */
export const updateEquipo = (id, data) => api.put(`${BASE}/equipos/${id}/`, data);

// ===== PARTIDOS =====

/** Listar partidos (usuario) */
export const getPartidos = () => api.get(`${BASE}/partidos/`);

/** Listar partidos (admin) */
export const getPartidosAdmin = () => api.get(`${BASE}/admin/partidos/`);

/** Crear partido */
export const createPartido = (data) => api.post(`${BASE}/partidos/`, data);

/** Detalle de un partido */
export const getPartido = (id) => api.get(`${BASE}/partidos/${id}/`);

/** Actualizar partido */
export const updatePartido = (id, data) => api.put(`${BASE}/partidos/${id}/`, data);

/** Eliminar partido */
export const deletePartido = (id) => api.delete(`${BASE}/partidos/${id}/`);

/** Registrar resultado de un partido */
export const registrarResultado = (id, data) =>
  api.post(`${BASE}/partidos/${id}/resultado/`, data);

// ===== PREDICCIONES =====

/** Listar predicciones del usuario */
export const getPredicciones = () => api.get(`${BASE}/predicciones/`);

/** Crear o actualizar predicción (upsert) */
export const upsertPrediccion = (data) => api.post(`${BASE}/predicciones/`, data);

// ===== PREDICCIONES ESPECIALES =====

/** Listar predicciones especiales del usuario */
export const getPrediccionesEspeciales = () =>
  api.get(`${BASE}/predicciones-especiales/`);

/** Crear o actualizar predicción especial (upsert) */
export const upsertPrediccionEspecial = (data) =>
  api.post(`${BASE}/predicciones-especiales/`, data);

// ===== RANKING =====

/** Obtener ranking (top + mi_posicion) */
export const getRanking = () => api.get(`${BASE}/ranking/`);

// ===== CONFIGURACIÓN =====

/** Obtener configuración de la edición */
export const getConfiguracion = () => api.get(`${BASE}/configuracion/`);

/** Actualizar configuración */
export const updateConfiguracion = (data) =>
  api.put(`${BASE}/configuracion/`, data);

// ===== CONFIGURACIÓN ESPECIALES =====

/** Listar configuraciones de predicciones especiales */
export const getConfigEspeciales = () =>
  api.get(`${BASE}/configuracion-especiales/`);

/** Crear configuración de predicción especial */
export const createConfigEspecial = (data) =>
  api.post(`${BASE}/configuracion-especiales/`, data);

/** Detalle de configuración especial */
export const getConfigEspecial = (id) =>
  api.get(`${BASE}/configuracion-especiales/${id}/`);

/** Actualizar configuración especial */
export const updateConfigEspecial = (id, data) =>
  api.put(`${BASE}/configuracion-especiales/${id}/`, data);

// ===== ESTADÍSTICAS =====

/** Obtener estadísticas generales */
export const getEstadisticas = () => api.get(`${BASE}/estadisticas/`);

// ===== HOME DATA (Consolidated) =====

/** Obtener todos los datos necesarios para la página home en una sola petición */
export const getHomeData = () => api.get(`${BASE}/home/`);
