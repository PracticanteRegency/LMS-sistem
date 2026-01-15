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


const analiticaService = {
  getProgreso,
  getEmpresas,
};

export default analiticaService;
