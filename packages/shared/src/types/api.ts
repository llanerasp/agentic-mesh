/**
 * Contrato de respuesta API unificado entre microservicios.
 * Discriminated union: el type narrowing obliga al consumidor a comprobar `success`
 * antes de acceder a `data` o `error`. Imposible olvidar un caso en tiempo de compilacion.
 */
export type ApiResponse<T> = { success: true; data: T; meta?: ResponseMeta } | { success: false; error: ApiError };

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'LLM_ERROR'
  | 'CIRCUIT_OPEN';

export interface ResponseMeta {
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasMore?: boolean;
}

// ---------- Helpers de construccion ----------

export const ok = <T>(data: T, meta?: ResponseMeta): ApiResponse<T> => {
  if (meta !== undefined) {
    return { success: true, data, meta };
  }
  return { success: true, data };
};

export const fail = (code: ErrorCode, message: string, details?: unknown): ApiResponse<never> => {
  const error: ApiError = { code, message };
  if (details !== undefined) {
    error.details = details;
  }
  return { success: false, error };
};

// ---------- Type guards ----------

export const isOk = <T>(res: ApiResponse<T>): res is Extract<ApiResponse<T>, { success: true }> => {
  return res.success === true;
};

export const isFail = <T>(res: ApiResponse<T>): res is Extract<ApiResponse<T>, { success: false }> => {
  return res.success === false;
};
