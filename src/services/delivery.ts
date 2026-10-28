import type { Conversation, Message } from './chat';
export type DeliveryState = 'sending' | 'sent' | 'seen' | 'failed';
export interface OutgoingMessage {
  id: string;
  peerId: string;
  conversationId: string;
  message: Message;
  state: Exclude<DeliveryState, 'seen'>;
  error?: string;
}
export type Outbox = Record<string, OutgoingMessage>;
export const deliveryLabels: Record<DeliveryState, string> = {
  sending: 'Đang gửi',
  sent: 'Đã gửi · Chưa xem',
  seen: 'Đã xem',
  failed: 'Gửi thất bại',
};
export function deliveryState(
  key: string,
  peerRead?: string,
  outgoing?: OutgoingMessage,
): DeliveryState {
  if (outgoing?.state === 'sending' || outgoing?.state === 'failed') {
    return outgoing.state;
  }
  if (peerRead && key <= peerRead) {
    return 'seen';
  }
  return outgoing?.state || 'sent';
}
export function mergedMessages(
  chat: Conversation | undefined,
  conversationId: string,
  outbox: Outbox,
) {
  const messages = { ...chat?.messages };
  Object.values(outbox)
    .filter(m => m.conversationId === conversationId)
    .forEach(m => {
      messages[m.id] = messages[m.id] || m.message;
    });
  return Object.entries(messages).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
}
export function lastMessageText(
  message: Message,
  ownId: string,
  peerName: string,
) {
  const author = message.senderId === ownId ? 'Bạn' : peerName;
  const content =
    message.type === 'location' ? 'Đã gửi một vị trí' : message.text || '';
  return `${author}: ${content}`;
}
export function listTime(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}
export function dateDivider(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) {
    return 'Hôm nay';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Hôm qua';
  }
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
