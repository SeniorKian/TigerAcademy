import axios, { type InternalAxiosRequestConfig } from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string> | null = null;

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('Refresh token is not available');

  const response = await axios.post('/api/auth/refresh-token', { refreshToken });
  const payload = response.data?.data ?? response.data;
  if (!payload?.accessToken) throw new Error('Invalid refresh response');

  localStorage.setItem('token', payload.accessToken);
  if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken);
  if (payload.user) localStorage.setItem('user', JSON.stringify(payload.user));
  return payload.accessToken as string;
};

// Request interceptor - add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - unwrap Result wrapper and handle 401
apiClient.interceptors.response.use(
  (response) => {
    // Unwrap {isSuccess, data, errors} wrapper from backend
    const body = response.data;
    if (body && typeof body === 'object' && 'isSuccess' in body) {
      // Replace response.data with the inner data
      response.data = body.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh-token');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => { refreshPromise = null; });
        const accessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        clearSession();
        const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
      }
    }

    if (error.response?.status === 401 && isAuthEndpoint) clearSession();
    return Promise.reject(error);
  }
);

export default apiClient;
