export * from './project-types';
export * from './margin-types';

export interface ApiSuccessResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface ApiErrorResponse {
  message: string;
  code?: string;
  status?: number;
  errors?: Array<{ field?: string; message: string }>;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
