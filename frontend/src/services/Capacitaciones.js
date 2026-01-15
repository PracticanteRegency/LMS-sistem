// PUT: Eliminar capacitación (requiere capacitacion_id)
export async function eliminarCapacitacion(capacitacionId) {
  // Llama a: PUT /capacitaciones/capacitaciones/ con body { capacitacion_id }
  const response = await api.put("capacitaciones/capacitaciones/", { capacitacion_id: capacitacionId });
  return response.data;
}
import axios from 'axios';
import api from "./axios";
import dedupe from './dedupe';

// GET: Obtener las capacitaciones
const getCapList = async () => {
  return dedupe('cap:getCapList', null, async () => {
    const response = await api.get("capacitaciones/capacitaciones/");
    return response.data;
  });
};

// GET: Obtener mis capacitaciones (del usuario autenticado)
const getMisCapacitaciones = async () => {
  return dedupe('cap:getMisCapacitaciones', null, async () => {
    const response = await api.get("capacitaciones/mis-capacitaciones/");
    return response.data;
  });
};

// POST: Crear una nueva capacitación con estructura completa (módulos, lecciones, preguntas, etc.)
// payload debe contener: { titulo, descripcion, imagen, fecha_inicio, fecha_fin, modulos, colaboradores }
const crearCapacitacionCompleta = async (payload) => {
  return dedupe('cap:crearCapacitacionCompleta', payload, async () => {
    const response = await api.post("capacitaciones/crear-capacitacion/", payload);
    return response.data;
  });
};

// POST: Crear una nueva capacitación (versión simplificada)
const createCapacitacion = async (data) => {
  return dedupe('cap:createCapacitacion', data, async () => {
    const response = await api.post("capacitaciones/capacitaciones/", data);
    return response.data;
  });
};

// POST: Subir archivo CSV para agregar colaboradores
const uploadColaboradoresCSV = async (file) => {
  return dedupe('cap:uploadColaboradoresCSV', { name: file?.name }, async () => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("capacitaciones/cargar/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  });
};

// post: crear capacitación (deprecated, use createCapacitacion)
const postCapList = async () => {
  return dedupe('cap:postCapList', null, async () => {
    try {
      const response = await axios.post(API_URL + 'capacitaciones/crear-capacitacion/', {
        headers: getAuthHeader(),
      });
      console.log('Cap Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching Cap:', error);
      throw error;
    }
  });
};

// Deprecated, use uploadColaboradoresCSV
const postCargarColab = async () => {
  return dedupe('cap:postCargarColab', null, async () => {
    try {
      const response = await axios.post(API_URL + 'capacitaciones/cargar/', {
        headers: getAuthHeader(),
      });
      console.log('Cap Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching Cap:', error);
      throw error;
    }
  });
};

// Core uploader: enforces backend requirements
// Fields required by backend:
// - key 'archivo' (multipart/form-data)
// - 'tipo' in {'capacitacion','leccion','pregunta','respuesta'}
// - if tipo==='leccion', must include 'subtipo' in {'imagen','pdf'}
// - allowed extensions: imagenes -> .jpg/.jpeg/.png ; pdf -> .pdf
const uploadArchivo = async (file, tipo, subtipo) => {
  return dedupe('cap:uploadArchivo', { name: file?.name, tipo, subtipo }, async () => {
    if (!file) throw new Error("Debe enviar un archivo.");
    if (!tipo) throw new Error("Debe enviar el tipo de archivo.");

    const formData = new FormData();
    formData.append("archivo", file);
    formData.append("tipo", String(tipo));

    // validar extensiones y subtipo
    const nameLower = (file.name || '').toLowerCase();
    const mime = file.type || '';

    if (tipo === 'leccion') {
      if (!subtipo) throw new Error("Debe especificar subtipo (imagen o pdf) para las lecciones.");
      formData.append("subtipo", String(subtipo));
      if (subtipo === 'pdf') {
        const isPdf = mime === 'application/pdf' || nameLower.endsWith('.pdf');
        if (!isPdf) throw new Error("Solo se aceptan archivos PDF (.pdf) para lecciones.");
      } else if (subtipo === 'imagen') {
        const isImg = mime.startsWith('image/') && (nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.png'));
        if (!isImg) throw new Error("Solo se aceptan imágenes .jpg/.jpeg/.png para lecciones.");
      } else {
        throw new Error(`Tipo de subtipo '${subtipo}' no reconocido.`);
      }
    } else if (tipo === 'capacitacion' || tipo === 'pregunta' || tipo === 'respuesta') {
      // imágenes para estos tipos (según mensajes de backend)
      const isImg = mime.startsWith('image/') && (nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.png'));
      if (!isImg) throw new Error("Solo se aceptan imágenes .jpg/.jpeg/.png.");
    } else {
      throw new Error(`Tipo '${tipo}' no reconocido.`);
    }

    const response = await api.post("capacitaciones/subir-archivoImagen/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  });
};

// Aliases for specific contexts
const uploadImagenCapacitacion = async (file) => uploadArchivo(file, 'capacitacion');
const uploadImagenLeccion = async (file) => uploadArchivo(file, 'leccion', 'imagen');
const uploadPdfLeccion = async (file) => uploadArchivo(file, 'leccion', 'pdf');
const uploadImagenPregunta = async (file) => uploadArchivo(file, 'pregunta');
const uploadImagenRespuesta = async (file) => uploadArchivo(file, 'respuesta');

// Backward compatibility: keep old name pointing to capacitacion image upload
const uploadFile = async (file) => uploadImagenCapacitacion(file);

// GET: Ver capacitaciones personales
const getCapacitacionById = async (id) => {
  return dedupe('cap:getById', id, async () => {
    const response = await api.get(`capacitaciones/${id}/`);
    return response.data;
  });
};

// GET: Ver capacitaciones personales
const getMiCapacitacion = async (id) => {
  return dedupe('cap:getMiCap', id, async () => {
    const response = await api.get(`/${id}/`);
    return response.data;
  });
};

// POST para completar lección (video o PDF)
const postCompletarLeccion = async (capacitacionId, leccionId, token) => {
  return dedupe('cap:postCompletarLeccion', { capacitacionId, leccionId }, async () => {
    const response = await api.post(
      `capacitaciones/leccion/${leccionId}/completar/`,
      { leccion_id: leccionId }
    );
    return response.data;
  });
};

//Post: responder lecciones formulario
const responderLeccion = async (capacitacionId, leccionId, token) => {
  return dedupe('cap:responderLeccion', { capacitacionId, leccionId }, async () => {
    const response = await api.post(
      `capacitaciones/leccion/${leccionId}/responder/`,
      { leccion_id: leccionId }
    );
    return response.data;
  });
};

// POST: Enviar respuestas de formulario
// payload debe contener: { respuestas: [id1, id2, ...] }
const enviarRespuestasFormulario = async (capacitacionId, leccionId, payload) => {
  return dedupe('cap:enviarRespuestasFormulario', { capacitacionId, leccionId, payload }, async () => {
    const response = await api.post(
      `capacitaciones/leccion/${leccionId}/responder/`,
      payload
    );
    return response.data;
  });
};

// enviar archivo CSV para cargar colaboradores
const cargarColaboradores = async (file) => {
  return dedupe('cap:cargarColaboradores', { name: file?.name }, async () => {
    const formData = new FormData();
    formData.append("archivo", file);

    const response = await api.post(
      `capacitaciones/cargar/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  });
};

export async function getCapacitacionDetalle(capacitacionId) {
  // Llama a: GET /capacitaciones/crear-capacitacion/<id>/
  // Respuesta esperada: objeto CapacitacionDetalleSerializer con campo `colaboradores`
  const response = await api.get(`capacitaciones/crear-capacitacion/${capacitacionId}/`);
  return response.data; // { id, titulo, descripcion, modulos, colaboradores: [...] }
}

// Actualizar campos de la capacitación (sincronizar si envías `colaboradores` completo)
export async function patchCapacitacion(capacitacionId, payload) {
  // Llama a: PATCH /capacitaciones/crear-capacitacion/<id>/
  // Payload: campos a actualizar o { colaboradores: [ids...] } para sincronizar
  const response = await api.patch(`capacitaciones/crear-capacitacion/${capacitacionId}/`, payload);
  return response.data;
}

// Agregar / eliminar colaboradores (operación parcial)
export async function updateColaboradores(capacitacionId, { add = [], remove = [] }) {
  // Llama a: POST /capacitaciones/crear-capacitacion/<id>/ con body { add: [...], remove: [...] }
  // Reglas en backend:
  // - No enviar IDs que estén en `add` y `remove` al mismo tiempo
  // - `add` debe contener IDs de colaboradores existentes
  // - Respuesta: { added: [...], removed: [...] }
  const body = { add, remove };
  const response = await api.post(`capacitaciones/crear-capacitacion/${capacitacionId}/`, body);
  return response.data;
}

// Ejemplo de uso rápido (con axios):
// import axios from 'axios';
// import { getCapacitacionDetalle, updateColaboradores } from './capacitaciones_helpers';
// const api = axios.create({ baseURL: '/api' , headers: { Authorization: 'Token ...' } });
// const detalle = await getCapacitacionDetalle(api, 12);
// const res = await updateColaboradores(api, 12, { add: [7], remove: [5] });

// Notas:
// - Tras un `updateColaboradores` se recomienda volver a ejecutar `getCapacitacionDetalle`
//   para actualizar la lista mostrada en UI.
// - Manejar errores HTTP 400/403/404 mostrando mensajes adecuados al usuario.

const certificadoDescargar = async (capacitacionId) => {
  return dedupe('cap:certificadoDescargar', { capacitacionId }, async () => {
    const response = await api.get(
      `capacitaciones/certificado/${capacitacionId}/`,
      {
        responseType: 'blob', // importante para archivos PDF
      }
    );
    return response.data;
  });
};



const CapListService = {
  getCapList,
  getMisCapacitaciones,
  getCapacitacionById,
  getCapacitacionDetalle,
  patchCapacitacion,
  updateColaboradores,
  createCapacitacion,
  crearCapacitacionCompleta,
  uploadFile, // alias (capacitacion image)
  uploadImagenCapacitacion: uploadImagenCapacitacion,
  uploadImagenLeccion: uploadImagenLeccion,
  uploadPdfLeccion: uploadPdfLeccion,
  uploadFilePDF: uploadPdfLeccion,
  uploadImagenPregunta: uploadImagenPregunta,
  uploadImagenRespuesta: uploadImagenRespuesta,
  uploadColaboradoresCSV,
  cargarColaboradores,
  postCapList,
  postCargarColab,
  getMiCapacitacion,
  postCompletarLeccion,
  responderLeccion,
  enviarRespuestasFormulario,
  certificadoDescargar,
  eliminarCapacitacion,
};

export default CapListService;