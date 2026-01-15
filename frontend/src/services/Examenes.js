
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
};

export default ExamenesService;
