
// @ts-nocheck
import api from "./axios";
import dedupe from './dedupe';

// GET: Obtener empresas, cargos y exámenes (estructura anidada)
const CargoEmpresaConExamenes = async () => {
  return dedupe('exam:CargoEmpresaConExamenes', null, async () => {
    const response = await api.get("examenes/cargo-empresa-examenes/");
    return response.data;
  });
};

// POST: Enviar correo con exámenes al trabajador
const EnviarCorreo = async (payload) => {
  return dedupe('exam:EnviarCorreo', payload, async () => {
    const response = await api.post("examenes/correo/enviar/", payload);
    return response.data;
  });
};

// GET: Obtener reporte de correos enviados (paginado)
const ObtenerReporteCorreos = async (page = 1, pageSize = 10) => {
  return dedupe(`exam:ReporteCorreos:${page}:${pageSize}`, null, async () => {
    const response = await api.get(`examenes/correo/reporte/?page=${page}&page_size=${pageSize}`);
    return response.data;
  });
};

// GET: Obtener detalle de un correo específico
const ObtenerDetalleCorreo = async (correoId) => {
  return dedupe(`exam:DetalleCorreo:${correoId}`, null, async () => {
    const response = await api.get(`examenes/correo/detalle/${correoId}/`);
    return response.data;
  });
};

// GET: Obtener lista de trabajadores de un correo (paginado)
const ObtenerTrabajadoresCorreo = async (correoId, page = 1, pageSize = 10, search = "") => {
  return dedupe(`exam:TrabajadoresCorreo:${correoId}:${page}:${pageSize}:${search}`, null, async () => {
    let url = `examenes/correo/${correoId}/trabajadores/?page=${page}&page_size=${pageSize}`;
    if (search && search.trim() !== "") {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    const response = await api.get(url);
    return response.data;
  });
};

// GET: Generar reporte Excel con filtros de fecha y empresas
const GenerarReporteExcel = async (fechaInicio, fechaFin, empresas) => {
  const response = await api.get(
    `examenes/imprimir-reporte/?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&empresas=${empresas}`,
    {
      responseType: 'blob'
    }
  );
  return response.data;
};

// POST: Enviar correos masivos por CSV
const EnviarCorreoMasivo = async (file) => {
  const formData = new FormData();
  formData.append('archivo_csv', file);
  
  const response = await api.post('examenes/correo/enviar-masivo/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// PATCH: Actualizar estado de trabajadores
const ActualizarEstadoTrabajadores = async (payload) => {
  const response = await api.patch("examenes/actualizar-estado/", payload);
  return response.data;
};

// GET: Preview de exámenes según empresa y cargo seleccionados
const PreviewExamenes = async (cargoId, empresaId) => {
  return dedupe(`exam:PreviewExamenes:${cargoId}:${empresaId}`, null, async () => {
    const response = await api.get(`examenes/correo/preview/${cargoId}/${empresaId}/`);
    return response.data;
  });
};

const EmpresaCargo = async () => {
  const response = await api.get("examenes/crear-examen/");
  return response.data;
};

// POST: Crear un nuevo examen
const crearExamen = async (payload) => {
  const response = await api.post("examenes/crear-examen/", payload);
  return response.data;
};

const FiltrarExamenesPorColaborador = async (colaboradorId, page = 1, pageSize = 10) => {
  // Detectar si es un UUID (formato: 8-4-4-4-12 caracteres hexadecimales)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUUID = colaboradorId && uuidPattern.test(colaboradorId.toString());
  
  console.log('FiltrarExamenesPorColaborador - colaboradorId:', colaboradorId, 'isUUID:', isUUID);
  
  const cacheKey = isUUID 
    ? `examenes:FiltrarExamenesPorColaborador:uuid=${colaboradorId}`
    : `examenes:FiltrarExamenesPorColaborador:id=${colaboradorId}:page=${page}:size=${pageSize}`;
  
  return dedupe(cacheKey, { colaboradorId, page, pageSize, isUUID }, async () => {
    try {
      let url = 'examenes/filtrar-examenes/';
      
      if (isUUID) {
        // Si es UUID, buscar por uuid
        url += `?uuid=${encodeURIComponent(colaboradorId)}`;
        console.log('Buscando por UUID - URL:', url);
      } else if (colaboradorId) {
        // Si es ID numérico, filtrar por colaborador
        url += `?enviado_por_id=${colaboradorId}&page=${page}&page_size=${pageSize}`;
        console.log('Buscando por ID colaborador - URL:', url);
      } else {
        console.log('Obteniendo lista de colaboradores - URL:', url);
      }
      
      const response = await api.get(url);
      console.log('Respuesta del backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching filtrar examenes por colaborador:', error);
      throw error;
    }
  });
};

const FiltrarExamenesPorUUID = async (uuid) => {
  return dedupe(`examenes:FiltrarExamenesPorUUID:${uuid}`, uuid, async () => {
    try {
      const url = `examenes/filtrar-examenes/?uuid=${encodeURIComponent(uuid)}`;
      console.log('Buscando por UUID - URL:', url);
      const response = await api.get(url);
      console.log('Respuesta del backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching filtrar examenes por UUID:', error);
      throw error;
    }
  });
};

const ExamenesService = {
  CargoEmpresaConExamenes,
  PreviewExamenes,
  EnviarCorreo,
  ObtenerReporteCorreos,
  ObtenerDetalleCorreo,
  ObtenerTrabajadoresCorreo,
  GenerarReporteExcel,
  EnviarCorreoMasivo,
  ActualizarEstadoTrabajadores,
  EmpresaCargo,
  crearExamen,
  FiltrarExamenesPorColaborador,
  FiltrarExamenesPorUUID,
};

export default ExamenesService;
