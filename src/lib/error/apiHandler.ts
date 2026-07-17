import { NextResponse } from 'next/server';
import { AppError } from './AppError';
import { logger } from '../logger';

type ApiRouteHandler = (req: Request, ...args: unknown[]) => Promise<Response> | Response;

export function apiHandler(handler: ApiRouteHandler) {
  return async (req: Request, ...args: unknown[]) => {
    try {
      return await handler(req, ...args);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        logger.warn({ err: error, url: req.url }, error.message);
        return NextResponse.json(
          {
            error: {
              message: error.message,
              code: error.errorCode,
            },
          },
          { status: error.statusCode }
        );
      }

      const err = error instanceof Error ? error : new Error(String(error));
      logger.error({ err, url: req.url }, 'Error interno no controlado en la API');

      const message =
        process.env.NODE_ENV === 'production'
          ? 'Algo salió mal en el servidor'
          : err.message || 'Error desconocido';

      return NextResponse.json(
        {
          error: {
            message,
            code: 'INTERNAL_SERVER_ERROR',
          },
        },
        { status: 500 }
      );
    }
  };
}
export default apiHandler;
