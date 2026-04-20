import { ok, fail, isOk, isFail, type ApiResponse } from '../api';

describe('ApiResponse helpers', () => {
  describe('ok()', () => {
    it('envuelve data en una respuesta de exito sin meta por defecto', () => {
      // Arrange + Act
      const res = ok({ foo: 'bar' });
      // Assert
      expect(res).toEqual({ success: true, data: { foo: 'bar' } });
      expect('meta' in res).toBe(false);
    });

    it('incluye meta cuando se le pasa', () => {
      const res = ok([1, 2, 3], { total: 3, page: 1, pageSize: 10 });
      if (!isOk(res)) throw new Error('expected ok');
      expect(res.meta).toEqual({ total: 3, page: 1, pageSize: 10 });
    });
  });

  describe('fail()', () => {
    it('construye una respuesta de error con code y message', () => {
      const res = fail('NOT_FOUND', 'usuario no encontrado');
      expect(res).toEqual({
        success: false,
        error: { code: 'NOT_FOUND', message: 'usuario no encontrado' },
      });
    });

    it('incluye details solo si se proporcionan', () => {
      const res = fail('VALIDATION_ERROR', 'input invalido', { field: 'email' });
      if (!isFail(res)) throw new Error('expected fail');
      expect(res.error.details).toEqual({ field: 'email' });
    });

    it('NO incluye details cuando son undefined', () => {
      const res = fail('INTERNAL_ERROR', 'kaput');
      if (!isFail(res)) throw new Error('expected fail');
      expect('details' in res.error).toBe(false);
    });
  });

  describe('isOk() / isFail()', () => {
    it('isOk devuelve true para exito', () => {
      expect(isOk(ok(42))).toBe(true);
    });

    it('isOk devuelve false para error', () => {
      expect(isOk(fail('INTERNAL_ERROR', 'kaput'))).toBe(false);
    });

    it('isFail devuelve true para error', () => {
      expect(isFail(fail('NOT_FOUND', 'no existe'))).toBe(true);
    });

    it('isOk hace type narrowing (data accesible sin error de TS)', () => {
      const res: ApiResponse<number> = ok(42);
      if (isOk(res)) {
        // Si el narrowing funciona, TS deja acceder a res.data sin cast.
        expect(res.data).toBe(42);
      } else {
        throw new Error('expected ok');
      }
    });
  });
});
