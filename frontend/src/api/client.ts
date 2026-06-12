import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

// Cloudinary uploads are stored as full https:// URLs; local dev files are
// bare filenames served through the Flask /api/uploads/ route.
export const uploadUrl = (filename: string) =>
  filename.startsWith('http') ? filename : `${import.meta.env.VITE_API_URL ?? '/api'}/uploads/${filename}`;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
