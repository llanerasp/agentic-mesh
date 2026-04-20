import { asUserId, asConversationId, asMessageId } from '../chat';

describe('Branded ID helpers', () => {
  it('asUserId marca el string como UserId', () => {
    const id = asUserId('u_123');
    // En runtime sigue siendo string. El branding es solo compile-time.
    expect(typeof id).toBe('string');
    expect(id).toBe('u_123');
  });

  it('los 3 helpers son funciones de identidad en runtime', () => {
    expect(asUserId('a')).toBe('a');
    expect(asConversationId('a')).toBe('a');
    expect(asMessageId('a')).toBe('a');
  });

  it('los tipos branded NO son intercambiables entre si (compile-time check)', () => {
    const cid = asConversationId('conv-1');
    // @ts-expect-error - no se puede asignar un ConversationId a UserId
    const _wrongAssignment: ReturnType<typeof asUserId> = cid;
    // Si este test compila y corre, significa que @ts-expect-error se activo
    // como esperabamos. En runtime no hay branding, todo son strings.
    expect(cid).toBe('conv-1');
  });
});
