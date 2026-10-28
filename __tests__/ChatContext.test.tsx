import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
jest.mock('../src/context/AuthContext', () => {
  const user = { uid: 'a' };
  return { useAuth: () => ({ user }) };
});
jest.mock('../src/services/firebase', () => ({
  errorMessage: (e: Error) => e.message,
}));
jest.mock('../src/services/chat', () => ({
  watchUsers: jest.fn(() => jest.fn()),
  watchPresence: jest.fn(() => jest.fn()),
  watchConversations: jest.fn(() => jest.fn()),
  watchConnection: jest.fn(() => jest.fn()),
  sendMessage: jest.fn(),
  createMessageId: jest.fn(() => '-message1'),
  conversationId: () => 'a_b',
}));
import { ChatProvider, useChatData } from '../src/context/ChatContext';
import {
  sendMessage,
  watchConversations,
  watchConnection,
  watchPresence,
  watchUsers,
} from '../src/services/chat';
let value: ReturnType<typeof useChatData>;
let tree: ReactTestRenderer.ReactTestRenderer;
function Probe() {
  value = useChatData();
  return null;
}
beforeEach(async () => {
  jest.clearAllMocks();
  jest.mocked(sendMessage).mockReset();
  await act(async () => {
    tree = ReactTestRenderer.create(
      <ChatProvider>
        <Probe />
      </ChatProvider>,
    );
  });
});
afterEach(async () => {
  await act(async () => tree.unmount());
});
test('keeps optimistic messages sending until the server acknowledges, then reconciles the snapshot', async () => {
  let acknowledge!: () => void;
  jest.mocked(sendMessage).mockImplementation(
    () =>
      new Promise<void>(resolve => {
        acknowledge = resolve;
      }),
  );
  await act(async () => {
    value.send('b', { type: 'text', text: 'Xin chào' });
  });
  expect(value.outbox['-message1'].state).toBe('sending');
  const receive = jest.mocked(watchConversations).mock.calls[0][1];
  await act(async () =>
    receive({
      a_b: {
        members: { a: true, b: true },
        messages: {
          '-message1': {
            senderId: 'a',
            type: 'text',
            text: 'Xin chào',
            createdAt: 10,
          },
        },
      },
    }),
  );
  expect(value.outbox['-message1'].state).toBe('sending');
  await act(async () => acknowledge());
  expect(value.outbox['-message1']).toBeUndefined();
  expect(value.chats.a_b.messages!['-message1'].text).toBe('Xin chào');
});
test('preserves a failed message and retries the same ID once despite repeated taps', async () => {
  jest
    .mocked(sendMessage)
    .mockRejectedValueOnce(new Error('Permission denied'));
  await act(async () => {
    value.send('b', { type: 'text', text: 'Gửi lại tôi' });
  });
  expect(value.outbox['-message1'].state).toBe('failed');
  expect(value.outbox['-message1'].error).toBe('Permission denied');
  let acknowledge!: () => void;
  jest.mocked(sendMessage).mockImplementation(
    () =>
      new Promise<void>(resolve => {
        acknowledge = resolve;
      }),
  );
  await act(async () => {
    value.retry('-message1');
    value.retry('-message1');
  });
  expect(sendMessage).toHaveBeenCalledTimes(2);
  expect(jest.mocked(sendMessage).mock.calls[1][3]).toBe('-message1');
  expect(value.outbox['-message1'].state).toBe('sending');
  await act(async () => acknowledge());
  expect(value.outbox['-message1'].state).toBe('sent');
});
test('cleans up all realtime subscriptions when leaving the account', async () => {
  const stops = [
    watchUsers,
    watchPresence,
    watchConversations,
    watchConnection,
  ].map(fn => jest.mocked(fn).mock.results[0].value);
  await act(async () => tree.unmount());
  stops.forEach(stop => expect(stop).toHaveBeenCalledTimes(1));
});
