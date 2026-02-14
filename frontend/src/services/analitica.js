import axios from 'axios';
import api from "./axios";
import dedupe from './dedupe';

// GET: Obtener progreso de analítica
const getProgreso = async () => {
  return dedupe('analitica:progreso', null, async () => {
    try {
      const response = await api.get('analitica/progreso/');
      console.log('Analytics Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics progress:', error);
      throw error;
    }
  });
};

// GET: obtener empresas
const getEmpresas = async () => {
  return dedupe('analitica:empresas', null, async () => {
    try {
      const response = await api.get('analitica/lista-empresas/');
      console.log('Empresas Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching empresas:', error);
      throw error;
    }
  });
};

// GET: obtener unidades
const getUnidades = async () => {
  return dedupe('analitica:unidades', null, async () => {
    try {
      const response = await api.get('analitica/lista-unidades-negocio/');
      console.log('Unidades Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching unidades:', error);
      throw error;
    }
  });
};

// GET: obtener proyectos
const getProyectos = async () => {
  return dedupe('analitica:proyectos', null, async () => {
    try {
      const response = await api.get('analitica/proyectos/');
      console.log('Proyectos Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching proyectos:', error);
      throw error;
    }
  });
};

// GET: obtener centros operativos
const getCentros = async () => {
  return dedupe('analitica:centros', null, async () => {
    try {
      const response = await api.get('analitica/lista-centros-operativos/');
      console.log('Centros Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching centros:', error);
      throw error;
    }
  });
};

// POST: crear empresa
const createEmpresa = async (payload) => {
  const response = await api.post('analitica/empresa/', payload);
  return response.data;
};

// PUT: actualizar empresa
const updateEmpresa = async (id, payload) => {
  const response = await api.put(`analitica/ver-empresa/${id}/`, payload);
  return response.data;
};

// POST: crear unidad
const createUnidad = async (payload) => {
  const response = await api.post('analitica/crear-unidad-negocio/', payload);
  return response.data;
};

// PUT: actualizar unidad
const updateUnidad = async (id, payload) => {
  const response = await api.put(`analitica/ver-unidad-negocio/${id}/`, payload);
  return response.data;
};

// POST: crear proyecto
const createProyecto = async (payload) => {
  const response = await api.post('analitica/crear-proyecto/', payload);
  return response.data;
};

// PUT: actualizar proyecto
const updateProyecto = async (id, payload) => {
  const response = await api.put(`analitica/ver-proyecto/${id}/`, payload);
  return response.data;
};

// POST: crear centro operativo
const createCentro = async (payload) => {
  const response = await api.post('analitica/crear-centro-operativo/', payload);
  return response.data;
};

// PUT: actualizar centro operativo
const updateCentro = async (id, payload) => {
  const response = await api.put(`analitica/ver-centro-operativo/${id}/`, payload);
  return response.data;
};

// GET: obtener cargos
const getCargos = async () => {
  return dedupe('analitica:cargos', null, async () => {
    try {
      const response = await api.get('user/Cargo/');
      return response.data;
    } catch (error) {
      console.error('Error fetching cargos:', error);
      throw error;
    }
  });
};

// POST: crear cargo
const createCargo = async (payload) => {
  const response = await api.post('user/Cargo/', payload);
  return response.data;
};

// PUT: actualizar cargo
const updateCargo = async (id, payload) => {
  const response = await api.put('user/Cargo/', { ...payload, idcargo: id });
  return response.data;
};

// DELETE: desactivar cargo
const deleteCargo = async (id) => {
  const response = await api.delete('user/Cargo/', { data: { idcargo: id } });
  return response.data;
};

// GET: obtener niveles
const getNiveles = async () => {
  return dedupe('analitica:niveles', null, async () => {
    try {
      const response = await api.get('user/Nivel/');
      return response.data;
    } catch (error) {
      console.error('Error fetching niveles:', error);
      throw error;
    }
  });
};

// POST: crear nivel
const createNivel = async (payload) => {
  const response = await api.post('user/Nivel/', payload);
  return response.data;
};

// PUT: actualizar nivel
const updateNivel = async (id, payload) => {
  const response = await api.put('user/Nivel/', { ...payload, idnivel: id });
  return response.data;
};

// DELETE: desactivar nivel
const deleteNivel = async (id) => {
  const response = await api.delete('user/Nivel/', { data: { idnivel: id } });
  return response.data;
};

// GET: obtener regionales
const getRegionales = async () => {
  return dedupe('analitica:regionales', null, async () => {
    try {
      const response = await api.get('user/Region/');
      return response.data;
    } catch (error) {
      console.error('Error fetching regionales:', error);
      throw error;
    }
  });
};

// POST: crear regional
const createRegional = async (payload) => {
  const response = await api.post('user/Region/', payload);
  return response.data;
};

// PUT: actualizar regional
const updateRegional = async (id, payload) => {
  const response = await api.put('user/Region/', { ...payload, idregional: id });
  return response.data;
};

// DELETE: desactivar regional
const deleteRegional = async (id) => {
  const response = await api.delete('user/Region/', { data: { idregional: id } });
  return response.data;
};

// GET: obtener jefe de proyecto
const getJefeProyecto = async (proyectoId) => {
  try {
    const response = await api.get(`analitica/jefes-proyecto/${proyectoId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching jefe proyecto:', error);
    throw error;
  }
};

// POST: asignar jefe a proyecto
const assignJefeProyecto = async (proyectoId, colaboradorId) => {
  try {
    const response = await api.post(`analitica/jefes-proyecto/${proyectoId}/`, {
      idcolaborador: colaboradorId
    });
    return response.data;
  } catch (error) {
    console.error('Error assigning jefe proyecto:', error);
    throw error;
  }
};

// PUT: actualizar jefe de proyecto
const updateJefeProyecto = async (proyectoId, colaboradorId) => {
  try {
    const response = await api.put(`analitica/jefes-proyecto/${proyectoId}/`, {
      idcolaborador: colaboradorId
    });
    return response.data;
  } catch (error) {
    console.error('Error updating jefe proyecto:', error);
    throw error;
  }
};

// DELETE: remover jefe de proyecto
const removeJefeProyecto = async (proyectoId) => {
  try {
    const response = await api.delete(`analitica/jefes-proyecto/${proyectoId}/`);
    return response.data;
  } catch (error) {
    console.error('Error removing jefe proyecto:', error);
    throw error;
  }
};


const analiticaService = {
  getProgreso,
  getEmpresas,
  getUnidades,
  getProyectos,
  getCentros,
  createEmpresa,
  updateEmpresa,
  createUnidad,
  updateUnidad,
  createProyecto,
  updateProyecto,
  createCentro,
  updateCentro,
  getCargos,
  createCargo,
  updateCargo,
  deleteCargo,
  getNiveles,
  createNivel,
  updateNivel,
  deleteNivel,
  getRegionales,
  createRegional,
  updateRegional,
  deleteRegional,
  getJefeProyecto,
  assignJefeProyecto,
  updateJefeProyecto,
  removeJefeProyecto,
};

export default analiticaService;
