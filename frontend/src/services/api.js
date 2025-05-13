import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://task-project-backend-1hx7.onrender.com';
console.log(import.meta.env.VITE_API_URL);
console.log('API_BASE_URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error)
);

apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.status, error.response?.data);

    if (error.response?.status === 401) {
      // Clear any stale token, but DO NOT redirect here
      localStorage.removeItem('authToken');
      // Let the caller (your login thunk / UI) handle the error
    }

    return Promise.reject(error);
  }
);

export default apiClient;
