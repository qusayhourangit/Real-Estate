// src/API/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://realestateapisystem-production-8b48.up.railway.app/api',
  headers: {
    Accept: "application/json"
  }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token'); // تغيير من authToken إلى token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;