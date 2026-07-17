import { describe, it, expect } from 'vitest';
import { AppError, NotFoundError, ValidationError } from './AppError';

describe('AppError', () => {
  it('debe inicializarse con los valores correctos', () => {
    const error = new AppError('Error operacional', 400, 'BAD_REQUEST');
    expect(error.message).toBe('Error operacional');
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe('BAD_REQUEST');
    expect(error.isOperational).toBe(true);
  });

  it('NotFoundError debe tener un statusCode de 404', () => {
    const error = new NotFoundError('No encontrado');
    expect(error.message).toBe('No encontrado');
    expect(error.statusCode).toBe(404);
    expect(error.errorCode).toBe('NOT_FOUND');
    expect(error.isOperational).toBe(true);
  });

  it('ValidationError debe tener un statusCode de 400', () => {
    const error = new ValidationError('Dato inválido');
    expect(error.message).toBe('Dato inválido');
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe('VALIDATION_ERROR');
    expect(error.isOperational).toBe(true);
  });
});
