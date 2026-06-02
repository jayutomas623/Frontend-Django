import axios from 'axios';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  const isPublic = config.url.includes('/auth/login') || config.url.includes('/auth/register');
  if (token && !isPublic) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default api;