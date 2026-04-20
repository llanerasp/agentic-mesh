import { AppError, ValidationError, NotFoundError, LLMError, isAppError } from '../AppError';

describe('AppError jerarquia', () => {
  it('ValidationError tiene code=VALIDATION_ERROR y statusCode=400', () => {
    const err = new ValidationError('input invalido');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('input invalido');
  });

  it('NotFoundError tiene statusCode=404', () => {
    const err = new NotFoundError('no existe');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('LLMError tiene statusCode=502 (bad gateway)', () => {
    const err = new LLMError('api caida');
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe('LLM_ERROR');
  });

  it('admite details opcionales', () => {
    const err = new ValidationError('x', { field: 'email' });
    expect(err.details).toEqual({ field: 'email' });
  });

  it('isAppError devuelve true para subclases', () => {
    expect(isAppError(new ValidationError('x'))).toBe(true);
    expect(isAppError(new NotFoundError('x'))).toBe(true);
  });

  it('isAppError devuelve false para Error generico', () => {
    expect(isAppError(new Error('generico'))).toBe(false);
  });

  it('isAppError devuelve false para valores no-Error', () => {
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError(42)).toBe(false);
  });

  it('preserva stack trace con nombre de la subclase', () => {
    const err = new ValidationError('x');
    expect(err.name).toBe('ValidationError');
    expect(err.stack).toContain('ValidationError');
  });

  it('instances de subclase tambien son instancia de AppError', () => {
    const err = new ValidationError('x');
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });
});
