import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";
const accessTokenKey = "spendly_access_token";
const refreshTokenKey = "spendly_refresh_token";

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
});

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
});

let refreshPromise: Promise<string> | null = null;

function isAuthEndpoint(url?: string) {
  return Boolean(url && ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"].includes(url));
}

export function getAccessToken() {
  return window.localStorage.getItem(accessTokenKey);
}

export function getRefreshToken() {
  return window.localStorage.getItem(refreshTokenKey);
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  window.localStorage.setItem(accessTokenKey, accessToken);
  window.localStorage.setItem(refreshTokenKey, refreshToken);
}

export function setAccessToken(accessToken: string) {
  window.localStorage.setItem(accessTokenKey, accessToken);
}

export function clearAuthTokens() {
  window.localStorage.removeItem(accessTokenKey);
  window.localStorage.removeItem(refreshTokenKey);
}

function redirectToLogin() {
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ access_token: string; token_type: string }>("/auth/refresh", { refresh_token: refreshToken })
      .then((response) => response.data.access_token)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();
      setAccessToken(newAccessToken);
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient.request(originalRequest);
    } catch (refreshError) {
      clearAuthTokens();
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  },
);
