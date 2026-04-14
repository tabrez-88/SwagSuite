export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const DEFAULT_TIMEOUT = 30_000;

export const baseClientConfig = {
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: DEFAULT_TIMEOUT,
} as const;
