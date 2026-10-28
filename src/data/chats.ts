export interface ChatMessage {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
}

export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: ChatMessage[];
}

export const chats: Chat[] = [
  {
    id: '1',
    name: 'Nhóm React Native',
    lastMessage: 'Build lần đầu hơi lâu nhỉ',
    time: '09:30',
    unread: 3,
    messages: [
      { id: 'm1', text: 'Chào mọi người!', fromMe: false, time: '09:12' },
      { id: 'm2', text: 'Chào bạn, app chạy chưa?', fromMe: false, time: '09:15' },
      { id: 'm3', text: 'Chạy rồi, đang build lần đầu', fromMe: true, time: '09:20' },
      { id: 'm4', text: 'Build lần đầu hơi lâu nhỉ', fromMe: false, time: '09:30' },
    ],
  },
  {
    id: '2',
    name: 'Minh Anh',
    lastMessage: 'Gửi mình cái icon mới nhé',
    time: '08:45',
    unread: 1,
    messages: [
      { id: 'm1', text: 'Logo mới đẹp đấy', fromMe: false, time: '08:40' },
      { id: 'm2', text: 'Gửi mình cái icon mới nhé', fromMe: false, time: '08:45' },
    ],
  },
  {
    id: '3',
    name: 'Team Mobile',
    lastMessage: 'Nhớ rebuild sau khi thêm lib native',
    time: 'Hôm qua',
    unread: 0,
    messages: [
      { id: 'm1', text: 'Nhớ rebuild sau khi thêm lib native', fromMe: false, time: 'Hôm qua' },
      { id: 'm2', text: 'Ok, đã rõ', fromMe: true, time: 'Hôm qua' },
    ],
  },
];
