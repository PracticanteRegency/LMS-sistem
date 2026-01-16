import axios from "axios";

export const API_URL = "http://62.72.7.176:8080/api/";

// Crear instancia principal
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// ===== INTERCEPTOR DE REQUEST =====
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem("user");

    if (user) {
      const userData = JSON.parse(user);
      const token = userData.token || userData.access;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===== INTERCEPTOR DE RESPUESTA =====
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data);

    if (error.response?.status === 401) {
      console.warn("Token expirado o inválido, cerrando sesión...");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
