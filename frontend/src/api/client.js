import axios from 'axios';

const envUrl = import.meta.env.VITE_API_URL;
export const API_BASE = envUrl
  ? envUrl.replace(/\/api\/?$/, '') + '/api'
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('simas_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('simas_token');
      localStorage.removeItem('simas_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
