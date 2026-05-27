import api from "./axios";
import dedupe from './dedupe';

const getFiltrarUsuarios = async (q = "", page = 1, pageSize = 10) => {
  return dedupe('perfil:getFiltrarUsuarios', { q, page, pageSize }, async () => {
    try {
      let url = `user/filtrar-usuarios/?q=${encodeURIComponent(q)}&page=${page}&page_size=${pageSize}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching filtrar usuarios:', error);
      throw error;
    }
  });
};

export async function registerTemporalUser(payload) {
  try {
    const resp = await api.post('user/registerTemporal/', payload);
    return resp.data;
  } catch (err) {
    throw err;
  }
}

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
  return { 'Content-Type': 'application/json' };
};

const getPerfil = async () => {
  return dedupe('perfil:getPerfil', null, async () => {
    try {
      const response = await api.get('user/perfil/');
      console.log('perfil Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching perfil:', error);
      throw error;
    }
  });
};

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
  return dedupe('perfil:getCargoRegionesNiveles', null, async () => {
    try {
      const response = await api.get('user/cargo-Nivel-Regional/');
      return response.data;
    } catch (error) {
      console.error('Error fetching cargo, regiones, niveles:', error);
      throw error;
    }
  });
};

const PatchCambiarEstadoUsuario = async (idcolaborador, payload) => {
  return dedupe('perfil:PatchCambiarEstadoUsuario', { idcolaborador, payload }, async () => {
    try {
      const response = await api.patch(`user/perfil/${idcolaborador}/`, payload, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error changing user status:', error);
      throw error;
    }
  });
};

const PutEditarPerfil = async (idcolaborador, payload) => {
  return dedupe('perfil:PutEditarPerfil', { idcolaborador, payload }, async () => {
    try {
      const response = await api.put(`user/register/${idcolaborador}/`, payload, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error editing perfil:', error);
      throw error;
    }
  });
};

const GetEditarPerfil = async (idcolaborador, payload) => {
  return dedupe('perfil:GetEditarPerfil', { idcolaborador, payload }, async () => {
    try {
      const response = await api.get(`user/register/${idcolaborador}/`, payload, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error editing perfil:', error);
      throw error;
    }
  });
};

const BuscarCorreoPorUUID = async (uuid) => {
  return dedupe('perfil:BuscarCorreoPorUUID', { uuid }, async () => {
    try {
      const response = await api.get(`examenes/filtrar-examenes/?uuid=${encodeURIComponent(uuid)}`);
      return response.data;
    } catch (error) {
      console.error('Error buscando correo por UUID:', error);
      throw error;
    }
  });
};

const cambiarEstadoUsuario = async (idcolaborador, payload) => {
  return dedupe('perfil:cambiarEstadoUsuario', { idcolaborador, payload }, async () => {
    try {
      const response = await api.patch(`user/cambiar-estado-usuario/${idcolaborador}/`, payload, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error changing user status:', error);
      throw error;
    }
  });
};

const actualizarRolUsuario = async (idcolaborador, payload) => {
  return dedupe('perfil:actualizarRolUsuario', { idcolaborador, payload }, async () => {
    try {
      const response = await api.patch(`user/actualizar-rol-usuario/${idcolaborador}/`, payload, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  });
};

const desactivarMultiplesUsuarios = async (payload) => {
  return dedupe('perfil:desactivarMultiplesUsuarios', payload, async () => {
    try {
      const response = await api.post(`user/cambiar-estado-usuario/`, payload, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error desactivating multiple users:', error);
      throw error;
    }
  });
};

const registrarUsuariosMasivo = async (file) => {
  return dedupe('perfil:registrarUsuariosMasivo', { name: file?.name }, async () => {
    try {
      const formData = new FormData();
      formData.append("archivo", file);

      const response = await api.post(`user/registrar-masivo/`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error registering users in bulk:', error);
      throw error;
    }
  });
};

const actualizarUsuariosMasivo = async (file) => {
  return dedupe('perfil:actualizarUsuariosMasivo', { name: file?.name }, async () => {
    try {
      const formData = new FormData();
      formData.append("archivo", file);

      const response = await api.put(`user/registrar-masivo/`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating users in bulk:', error);
      throw error;
    }
  });
};

const GetReporteUsuarios = async (file) => {
  return dedupe('perfil:GetReporteUsuarios', { file }, async () => {
    const response = await api.get(`user/reporte-usuarios/?file=${file}`);
    return response.data;
  });
};

const descargarReporteUsuarios = async () => {
  return dedupe('perfil:descargarReporteUsuarios', null, async () => {
    try {
      const response = await api.get('user/reporte-usuarios/', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Reporte_Usuarios.xlsx');

      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      return response.data;
    } catch (error) {
      console.error('Error descargando reporte de usuarios:', error);
      throw error;
    }
  });
};

const cambiarContrasenaUsuario = async (idcolaborador, nueva_contrasena) => {
  try {
    const response = await api.patch(`user/cambiar-contrasena/${idcolaborador}/`, { nueva_contrasena }, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    throw error;
  }
};

const Perfil = {
  getPerfil,
  getListUsers,
  getPerfilCapById,
  getPerfilUserById,
  getCargoRegionesNiveles,
  getFiltrarUsuarios,
  PatchCambiarEstadoUsuario,
  registerTemporalUser,
  PutEditarPerfil,
  GetEditarPerfil,
  BuscarCorreoPorUUID,
  cambiarEstadoUsuario,
  actualizarRolUsuario,
  desactivarMultiplesUsuarios,
  registrarUsuariosMasivo,
  actualizarUsuariosMasivo,
  GetReporteUsuarios,
  descargarReporteUsuarios,
  cambiarContrasenaUsuario,
};

export default Perfil;
