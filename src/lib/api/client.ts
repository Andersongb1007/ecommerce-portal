import { env } from '../validation/env';
import {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from '../error/AppError';
import { logger } from '../logger';

export interface RequestOptions extends RequestInit {
  token?: string;
  skipErrorHandling?: boolean;
  credentials?: RequestCredentials;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, skipErrorHandling = false, credentials, ...fetchOptions } = options;
  const baseUrl = env.NEXT_PUBLIC_API_URL;
  const url = path.startsWith('/api/')
    ? path
    : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(fetchOptions.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const finalOptions: RequestInit = {
    ...fetchOptions,
    headers,
    credentials,
  };

  try {
    logger.debug({ msg: 'Initiating API request', path, method: finalOptions.method || 'GET' });
    const response = await fetch(url, finalOptions);

    if (!response.ok) {
      if (skipErrorHandling) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      let errorMessage = 'Ocurrió un error en la solicitud';
      let errorCode = 'API_ERROR';

      try {
        const errorData = await response.json();
        // NestJS suele retornar error en el formato: { statusCode, message, error }
        // O nuestro apiHandler interno: { error: { message, code } }
        if (errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
          errorCode = errorData.error.code || errorCode;
        } else if (errorData.message) {
          errorMessage = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message;
          errorCode = errorData.error || errorCode;
        }
      } catch {
        // La respuesta no era JSON
      }

      let errorInstance: AppError;
      switch (response.status) {
        case 401:
          errorInstance = new UnauthorizedError(errorMessage, errorCode);
          break;
        case 403:
          errorInstance = new ForbiddenError(errorMessage, errorCode);
          break;
        case 404:
          errorInstance = new NotFoundError(errorMessage, errorCode);
          break;
        case 400:
          errorInstance = new BadRequestError(errorMessage, errorCode);
          break;
        default:
          errorInstance = new AppError(errorMessage, response.status, errorCode);
      }

      logger.warn({
        msg: 'API Request failed',
        path,
        status: response.status,
        errorCode,
        errorMessage,
      });

      throw errorInstance;
    }

    logger.debug({
      msg: 'API Request successful',
      path,
      status: response.status,
    });

    if (response.status === 204) {
      return null as unknown as T;
    }

    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return null as unknown as T;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    const finalError = new AppError(
      error instanceof Error ? error.message : 'Error de conexión con el servidor',
      500,
      'CONNECTION_ERROR'
    );
    logger.error({
      msg: 'API Request connection error',
      path,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });
    throw finalError;
  }
}
