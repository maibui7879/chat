import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  watchUsers,
  watchPresence,
  watchConversations,
  watchConnection,
  sendMessage,
  createMessageId,
  conversationId,
  type Message,
  type Profile,
  type Conversation,
} from '../services/chat';
import { errorMessage } from '../services/firebase';
import type { Outbox, OutgoingMessage } from '../services/delivery';
interface Data {
  users: Record<string, Profile>;
  presence: Record<string, Record<string, boolean>>;
  chats: Record<string, Conversation>;
  error: string;
  loading: boolean;
  connected: boolean;
}
interface ChatValue extends Data {
  outbox: Outbox;
  send: (
    peer: string,
    content: Omit<Message, 'senderId' | 'createdAt'>,
  ) => string;
  retry: (key: string) => void;
  dismiss: (key: string) => void;
}
const initial: Data = {
  users: {},
  presence: {},
  chats: {},
  error: '',
  loading: true,
  connected: true,
};
const Context = createContext<ChatValue | null>(null);
export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<Data>(initial);
  const [outbox, setOutbox] = useState<Outbox>({});
  const outboxRef = useRef<Outbox>({});
  const mounted = useRef(true);
  const inFlight = useRef(new Set<string>());
  const updateOutbox = useCallback((change: (old: Outbox) => Outbox) => {
    outboxRef.current = change(outboxRef.current);
    if (mounted.current) {
      setOutbox(outboxRef.current);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!user) {
      return;
    }
    const fail = (e: Error) =>
      setData(d => ({ ...d, error: errorMessage(e), loading: false }));
    const stops = [
      watchUsers(users => setData(d => ({ ...d, users })), fail),
      watchPresence(presence => setData(d => ({ ...d, presence })), fail),
      watchConnection(connected => setData(d => ({ ...d, connected }))),
      watchConversations(
        user.uid,
        chats => setData(d => ({ ...d, chats, loading: false })),
        fail,
      ),
    ];
    return () => stops.forEach(stop => stop());
  }, [user]);
  const transmit = useCallback(
    async (item: OutgoingMessage) => {
      if (inFlight.current.has(item.id)) {
        return;
      }
      inFlight.current.add(item.id);
      updateOutbox(old => ({
        ...old,
        [item.id]: { ...item, state: 'sending', error: undefined },
      }));
      const { senderId, createdAt, ...content } = item.message;
      try {
        await sendMessage(senderId, item.peerId, content, item.id);
        updateOutbox(old => ({
          ...old,
          [item.id]: { ...item, state: 'sent' },
        }));
      } catch (e) {
        updateOutbox(old => ({
          ...old,
          [item.id]: { ...item, state: 'failed', error: errorMessage(e) },
        }));
      } finally {
        inFlight.current.delete(item.id);
      }
    },
    [updateOutbox],
  );
  useEffect(() => {
    const confirmed = Object.values(outbox).filter(
      item =>
        item.state === 'sent' &&
        data.chats[item.conversationId]?.messages?.[item.id],
    );
    if (confirmed.length) {
      updateOutbox(old => {
        const next = { ...old };
        confirmed.forEach(item => delete next[item.id]);
        return next;
      });
    }
  }, [data.chats, outbox, updateOutbox]);
  const send = useCallback(
    (peerId: string, content: Omit<Message, 'senderId' | 'createdAt'>) => {
      if (
        !user ||
        peerId === user.uid ||
        (content.type === 'text' && !content.text?.trim())
      ) {
        throw new Error('Tin nhắn không hợp lệ.');
      }
      const id = createMessageId();
      const item: OutgoingMessage = {
        id,
        peerId,
        conversationId: conversationId(user.uid, peerId),
        message: { ...content, senderId: user.uid, createdAt: Date.now() },
        state: 'sending',
      };
      transmit(item);
      return id;
    },
    [user, transmit],
  );
  const retry = useCallback(
    (key: string) => {
      const item = outboxRef.current[key];
      if (item?.state === 'failed') {
        transmit(item);
      }
    },
    [transmit],
  );
  const dismiss = useCallback(
    (key: string) => {
      if (outboxRef.current[key]?.state !== 'failed') {
        return;
      }
      updateOutbox(old => {
        const next = { ...old };
        delete next[key];
        return next;
      });
    },
    [updateOutbox],
  );
  return (
    <Context.Provider value={{ ...data, outbox, send, retry, dismiss }}>
      {children}
    </Context.Provider>
  );
}
export function useChatData() {
  const data = useContext(Context);
  if (!data) {
    throw new Error('Thiếu ChatProvider');
  }
  return data;
}
