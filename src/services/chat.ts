import { AppState } from 'react-native';
import {
  equalTo,
  onDisconnect,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  runTransaction,
  serverTimestamp,
  set,
  update,
} from 'firebase/database';
import { db } from './firebase';
export interface Profile {
  name: string;
}
export interface Message {
  senderId: string;
  type: 'text' | 'location';
  text?: string;
  latitude?: number;
  longitude?: number;
  createdAt: number;
}
export interface Conversation {
  members: Record<string, boolean>;
  messages?: Record<string, Message>;
  read?: Record<string, string>;
}
export function conversationId(a: string, b: string) {
  return [a, b].sort().join('_');
}
export function watchUsers(
  next: (users: Record<string, Profile>) => void,
  fail: (e: Error) => void,
) {
  return onValue(ref(db(), 'users'), s => next(s.val() || {}), fail);
}
export function watchPresence(
  next: (users: Record<string, Record<string, boolean>>) => void,
  fail: (e: Error) => void,
) {
  return onValue(ref(db(), 'presence'), s => next(s.val() || {}), fail);
}
export function watchConversations(
  uid: string,
  next: (items: Record<string, Conversation>) => void,
  fail: (e: Error) => void,
) {
  const parts: Record<string, Conversation>[] = [{}, {}];
  const stops = ['userA', 'userB'].map((field, index) =>
    onValue(
      query(ref(db(), 'conversations'), orderByChild(field), equalTo(uid)),
      snapshot => {
        parts[index] = snapshot.val() || {};
        next({ ...parts[0], ...parts[1] });
      },
      fail,
    ),
  );
  return () => stops.forEach(stop => stop());
}
export function startPresence(uid: string, fail: (e: Error) => void) {
  const session = push(ref(db(), `presence/${uid}`));
  let active = true;
  let generation = 0;
  const publish = async () => {
    const version = ++generation;
    try {
      await onDisconnect(session).remove();
      if (
        active &&
        version === generation &&
        AppState.currentState === 'active'
      ) {
        await set(session, true);
      }
    } catch (e) {
      if (active) {
        fail(e as Error);
      }
    }
  };
  const stop = onValue(
    ref(db(), '.info/connected'),
    s => {
      if (s.val()) {
        publish();
      }
    },
    fail,
  );
  const sub = AppState.addEventListener('change', state => {
    if (state === 'active') {
      publish();
    } else {
      generation++;
      set(session, null).catch(fail);
    }
  });
  return async () => {
    active = false;
    generation++;
    stop();
    sub.remove();
    await set(session, null);
  };
}
export function watchConnection(next: (connected: boolean) => void) {
  return onValue(ref(db(), '.info/connected'), s => next(s.val() === true));
}
export function createMessageId() {
  const key = push(ref(db(), 'messageIds')).key;
  if (!key) {
    throw new Error('Không tạo được mã tin nhắn.');
  }
  return key;
}
export async function sendMessage(
  uid: string,
  peer: string,
  content: Omit<Message, 'senderId' | 'createdAt'>,
  messageId = createMessageId(),
) {
  if (uid === peer || (content.type === 'text' && !content.text?.trim())) {
    return;
  }
  const id = conversationId(uid, peer);
  const [userA, userB] = [uid, peer].sort();
  // Atomic metadata creation; messages and receipts are never overwritten.
  await update(ref(db(), `conversations/${id}`), {
    userA,
    userB,
    [`members/${uid}`]: true,
    [`members/${peer}`]: true,
  });
  await set(ref(db(), `conversations/${id}/messages/${messageId}`), {
    ...content,
    senderId: uid,
    createdAt: serverTimestamp(),
  });
}
export function markRead(id: string, uid: string, key: string) {
  return runTransaction(
    ref(db(), `conversations/${id}/read/${uid}`),
    current => {
      if (typeof current === 'string' && current >= key) {
        return;
      }
      return key;
    },
    { applyLocally: false },
  );
}
export function messageEntries(chat?: Conversation) {
  return Object.entries(chat?.messages || {}).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
}
export function unreadCount(chat: Conversation, uid: string) {
  return messageEntries(chat).filter(
    ([key, m]) => m.senderId !== uid && key > (chat.read?.[uid] || ''),
  ).length;
}
export function timeLabel(timestamp?: number) {
  return timestamp
    ? new Date(timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Đang gửi';
}
export function preview(m?: Message) {
  return m?.type === 'location' ? 'Vị trí' : m?.text || '';
}
