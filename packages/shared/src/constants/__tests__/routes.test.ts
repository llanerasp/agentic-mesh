import { INTERNAL_ROUTES, PUBLIC_ROUTES, CORRELATION_HEADER } from '../routes';

describe('routes constants', () => {
  describe('INTERNAL_ROUTES.conversation', () => {
    it('addMessage construye la ruta con el conversationId', () => {
      expect(INTERNAL_ROUTES.conversation.addMessage('abc123')).toBe('/conversations/abc123/messages');
    });

    it('getConversation construye la ruta con el conversationId', () => {
      expect(INTERNAL_ROUTES.conversation.getConversation('abc123')).toBe('/conversations/abc123');
    });

    it('createConversation es un path estatico', () => {
      expect(INTERNAL_ROUTES.conversation.createConversation).toBe('/conversations');
    });
  });

  describe('INTERNAL_ROUTES.llm', () => {
    it('generate es /generate', () => {
      expect(INTERNAL_ROUTES.llm.generate).toBe('/generate');
    });
  });

  describe('INTERNAL_ROUTES.health', () => {
    it('liveness y readiness estan separados', () => {
      expect(INTERNAL_ROUTES.health.liveness).toBe('/health');
      expect(INTERNAL_ROUTES.health.readiness).toBe('/health/ready');
    });
  });

  describe('PUBLIC_ROUTES', () => {
    it('chat es /chat', () => {
      expect(PUBLIC_ROUTES.chat).toBe('/chat');
    });
  });

  describe('headers de correlacion', () => {
    it('CORRELATION_HEADER es lowercase (HTTP/2)', () => {
      // HTTP/2 obliga a que los headers sean minusculas.
      expect(CORRELATION_HEADER).toBe(CORRELATION_HEADER.toLowerCase());
    });
  });
});
