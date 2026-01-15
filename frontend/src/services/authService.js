import axios from 'axios';
import api from "./axios";
import dedupe from './dedupe';


// Iniciar sesión
const login = async (data) => {
  // Deduplicate simultaneous login attempts with same credentials
  return dedupe('auth:login', data, async () => {
    const response = await api.post('auth/token/', data);
    if (response) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  });
};

// Cerrar sesión
const logout = () => {
  localStorage.removeItem('user');
};

const authService = {
  login,
  logout,
};

export default authService;