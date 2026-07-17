export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, errorCode: string, isOperational = true) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado', errorCode = 'NOT_FOUND') {
    super(message, 404, errorCode);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Datos de entrada inválidos', errorCode = 'VALIDATION_ERROR') {
    super(message, 400, errorCode);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado', errorCode = 'UNAUTHORIZED') {
    super(message, 401, errorCode);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso prohibido', errorCode = 'FORBIDDEN') {
    super(message, 403, errorCode);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Solicitud incorrecta', errorCode = 'BAD_REQUEST') {
    super(message, 400, errorCode);
  }
}
