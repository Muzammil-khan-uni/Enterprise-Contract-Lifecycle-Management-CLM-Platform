import axios from 'axios';

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
});

let currentAccessToken: string | null = null;
export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
}

axiosClient.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axiosClient
      .post('/auth/refresh')
      .then((res) => {
        const newToken = res.data.data.accessToken as string;
        setAccessToken(newToken);
        return newToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

let onAuthFailure: (() => void) | null = null;

export function setOnAuthFailure(handler: () => void): void {
  onAuthFailure = handler;
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status !== 401 || originalRequest._retried || originalRequest.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    try {
      const newToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      onAuthFailure?.();
      return Promise.reject(refreshError);
    }
  }
);
