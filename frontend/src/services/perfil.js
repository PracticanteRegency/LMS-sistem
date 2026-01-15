// Registra un usuario temporal
export async function registerTemporalUser(payload) {
  try {
    const resp = await api.post('user/registerTemporal/', payload);
    // Puedes retornar resp.data si se requiere
    return resp.data;
  } catch (err) {
    // Puedes lanzar el error para que el componente lo maneje
    throw err;
  }
}
import api from "./axios";
import dedupe from './dedupe';


// Obtener el token del localStorage
const getAuthHeader = () => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      const token = userData.token || userData.access;
      if (token) {
        return {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  return {
    'Content-Type': 'application/json',
  };
};

// GET: Obtener las capacitaciones
const getPerfil = async () => {
  // Deduplicate in-flight requests: if a request is already pending, return the same promise
  if (getPerfil._inFlight) return getPerfil._inFlight;
  getPerfil._inFlight = (async () => {
    try {
      const response = await api.get('user/perfil/');
      console.log('perfil Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching perfil:', error);
      throw error;
    } finally {
      // clear the in-flight promise when finished so future calls can refetch
      getPerfil._inFlight = null;
    }
  })();
  return getPerfil._inFlight;
};

// GET: Obtener la lista de usuarios

const getListUsers = async (page = 1, pageSize = 10, search = "") => {
  return dedupe('perfil:getListUsers', { page, pageSize, search }, async () => {
    try {
      let url = `user/lista-usuarios/?page=${page}&page_size=${pageSize}`;
      if (search && search.trim() !== "") {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      const response = await api.get(url);
      console.log('list users Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching list users:', error);
      throw error;
    }
  });
};

const getPerfilCapById = async (idcolaborador, capacitacion_id) => {
  return dedupe('perfil:getPerfilCapById', { idcolaborador, capacitacion_id }, async () => {
    try {
      const response = await api.get(`user/perfil/${idcolaborador}/capacitacion/${capacitacion_id}/`);
      console.log('Cap users Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching Cap users:', error);
      throw error;
    }
  });
};

const getPerfilUserById = async (idcolaborador) => {
  return dedupe('perfil:getPerfilUserById', idcolaborador, async () => {
    const response = await api.get(`user/perfil/${idcolaborador}/`);
    return response.data;
  });
};

const getCargoRegionesNiveles = async () => {
  try {
    const response = await api.get('user/cargo-Nivel-Regional/');
    return response.data;
  } catch (error) {
    console.error('Error fetching cargo, regiones, niveles:', error);
    throw error;
  }
};

const Perfil = {
    getPerfil,
    getListUsers,
    getPerfilCapById,
    getPerfilUserById,
    getCargoRegionesNiveles,
};

export default Perfil