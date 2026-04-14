import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { baseClientConfig } from './config';
import type { ApiError, ApiErrorResponse } from '@/types';

export const apiClient = axios.create({
  ...baseClientConfig,
  headers: { 'Content-Type': 'application/json' },
});

type GlobalErrorHandler = (error: AxiosError<ApiErrorResponse>) => void;

let globalErrorHandler: GlobalErrorHandler | null = null;

export function setGlobalErrorHandler(handler: GlobalErrorHandler | null) {
  globalErrorHandler = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (globalErrorHandler) {
      try {
        globalErrorHandler(error);
      } catch {
        // ignore handler failures — don't block original rejection
      }
    }
    return Promise.reject(error);
  },
);

export function toApiError(error: unknown, fallback = 'Request failed'): ApiError {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return {
      message: error.response?.data?.message || error.message || fallback,
      code: error.response?.data?.code,
      status: error.response?.status,
    };
  }
  if (error instanceof Error) return { message: error.message || fallback };
  return { message: fallback };
}

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response: AxiosResponse<T> = await apiClient.request<T>(config);
  return response.data;
}

export default apiClient;
