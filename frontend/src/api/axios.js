import axios from 'axios';

// Create axios instance (shared singleton) and enable credentials
const api = axios.create({
  withCredentials: true,
});

// Initialize Authorization header from stored access token
const initAccessToken = () => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
};

initAccessToken();

// Refresh logic: queue requests while token is being refreshed
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Response interceptor to handle 401 responses and refresh token
api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;

    // If there's no response or it's not 401, reject immediately
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // Prevent infinite loop
    if (originalRequest._retry) return Promise.reject(error);
    originalRequest._retry = true;

    try {
      if (isRefreshing) {
        // Queue the request until token is refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        // No refresh token - force logout handled by app
        return Promise.reject(error);
      }

      // Call backend refresh endpoint. Backend expects { refreshToken } in body.
      const res = await api.post('http://localhost:3000/api/users/refresh', { refreshToken });

      const newAccessToken = res.data?.data?.tokens?.accessToken;
      const newRefreshToken = res.data?.data?.tokens?.refreshToken;

      if (newAccessToken) {
        localStorage.setItem('accessToken', newAccessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      }
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      processQueue(null, newAccessToken);
      isRefreshing = false;

      // retry original request with new token
      originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (err) {
      processQueue(err, null);
      isRefreshing = false;
      // Notify app that refresh failed so it can logout the user
      try {
        window.dispatchEvent(new CustomEvent('auth:refreshFailed', { detail: { error: err } }));
      } catch (e) {
        // ignore
      }
      // Let the app handle logout if needed
      return Promise.reject(err);
    }
  }
);

export default api;
