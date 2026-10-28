jest.mock('firebase/database', () => ({}));
jest.mock('../src/services/firebase', () => ({ db: jest.fn() }));
import {
  conversationId,
  messageEntries,
  unreadCount,
  preview,
  type Conversation,
} from '../src/services/chat';
const chat: Conversation = {
  members: { a: true, b: true },
  messages: {
    '003': {
      senderId: 'b',
      type: 'location',
      latitude: 10,
      longitude: 106,
      createdAt: 3,
    },
    '001': { senderId: 'b', type: 'text', text: 'Xin chào', createdAt: 1 },
    '002': { senderId: 'a', type: 'text', text: 'Chào bạn', createdAt: 2 },
  },
  read: { a: '001' },
};
test('both participants address the same conversation', () => {
  expect(conversationId('a', 'b')).toBe(conversationId('b', 'a'));
});
test('counts only incoming messages after the last read key', () => {
  expect(unreadCount(chat, 'a')).toBe(1);
  expect(unreadCount({ ...chat, read: { a: '003' } }, 'a')).toBe(0);
  expect(unreadCount({ ...chat, read: {} }, 'a')).toBe(2);
});
test('orders message snapshots and previews a location', () => {
  expect(messageEntries(chat).map(([key]) => key)).toEqual([
    '001',
    '002',
    '003',
  ]);
  expect(preview(chat.messages!['003'])).toBe('Vị trí');
  expect(messageEntries()).toEqual([]);
});
