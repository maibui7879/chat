import {
  deliveryState,
  lastMessageText,
  mergedMessages,
  type OutgoingMessage,
} from '../src/services/delivery';
import type { Conversation } from '../src/services/chat';
const outgoing: OutgoingMessage = {
  id: '002',
  peerId: 'b',
  conversationId: 'a_b',
  state: 'sending',
  message: { senderId: 'a', type: 'text', text: 'Chào bạn', createdAt: 2 },
};
test('a local pending write never appears sent or viewed before acknowledgement', () => {
  expect(deliveryState('002', undefined, outgoing)).toBe('sending');
  expect(deliveryState('002', '003', outgoing)).toBe('sending');
});
test('a failed message is not marked viewed when a later message was read', () => {
  expect(deliveryState('002', '004', { ...outgoing, state: 'failed' })).toBe(
    'failed',
  );
});
test('only acknowledged messages covered by the peer receipt appear viewed', () => {
  expect(deliveryState('002', '001')).toBe('sent');
  expect(deliveryState('002', '002')).toBe('seen');
  expect(deliveryState('002', '004', { ...outgoing, state: 'sent' })).toBe(
    'seen',
  );
});
test('merges the local outbox without duplicating live Firebase messages', () => {
  const chat: Conversation = {
    members: { a: true, b: true },
    messages: { '002': { ...outgoing.message, createdAt: 20 } },
  };
  const local = {
    ...outgoing,
    id: '003',
    message: { ...outgoing.message, createdAt: 3 },
  };
  const entries = mergedMessages(chat, 'a_b', {
    '002': outgoing,
    '003': local,
    '004': { ...local, id: '004', conversationId: 'a_c' },
  });
  expect(entries.map(([id]) => id)).toEqual(['002', '003']);
  expect(entries[0][1].createdAt).toBe(20);
});
test('last-message previews distinguish yourself and the contact for text and locations', () => {
  expect(lastMessageText(outgoing.message, 'a', 'Lan')).toBe('Bạn: Chào bạn');
  expect(
    lastMessageText({ ...outgoing.message, senderId: 'b' }, 'a', 'Lan'),
  ).toBe('Lan: Chào bạn');
  expect(
    lastMessageText({ ...outgoing.message, type: 'location' }, 'a', 'Lan'),
  ).toBe('Bạn: Đã gửi một vị trí');
});
