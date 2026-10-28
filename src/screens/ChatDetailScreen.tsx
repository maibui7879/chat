import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type FlatListProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { MessageStatus } from '../components/MessageStatus';
import { useAuth } from '../context/AuthContext';
import { useChatData } from '../context/ChatContext';
import {
  conversationId,
  markRead,
  timeLabel,
  type Message,
} from '../services/chat';
import {
  dateDivider,
  deliveryLabels,
  deliveryState,
  mergedMessages,
} from '../services/delivery';
import { errorMessage } from '../services/firebase';
import { currentLocation } from '../services/location';
import type { RootStackScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
type Entry = [string, Message];
export function ChatDetailScreen({
  route,
  navigation,
}: RootStackScreenProps<'ChatDetail'>) {
  const { peerId, name } = route.params;
  const { user } = useAuth();
  const {
    users,
    presence,
    chats,
    error,
    outbox,
    connected,
    send,
    retry,
    dismiss,
  } = useChatData();
  const uid = user!.uid;
  const id = conversationId(uid, peerId);
  const chat = chats[id];
  const peerName = users[peerId]?.name || name;
  const online = Object.values(presence[peerId] || {}).some(Boolean);
  const messages = useMemo(
    () => mergedMessages(chat, id, outbox),
    [chat, id, outbox],
  );
  const peerRead = chat?.read?.[peerId];
  const lastSeenOwn = messages
    .filter(
      ([key, m]) =>
        m.senderId === uid &&
        deliveryState(key, peerRead, outbox[key]) === 'seen',
    )
    .at(-1)?.[0];
  const latestKey = messages.at(-1)?.[0];
  const latestSender = messages.at(-1)?.[1].senderId;
  const focused = useIsFocused();
  const list = useRef<FlatList<Entry>>(null);
  const [draft, setDraft] = useState('');
  const [locating, setLocating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [nearBottom, setNearBottom] = useState(true);
  const bottomRef = useRef(true);
  const initialScroll = useRef(false);
  const [newCount, setNewCount] = useState(0);
  const [visibleIncoming, setVisibleIncoming] = useState<string>();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [receiptError, setReceiptError] = useState('');
  const scrollToBottom = useCallback((animated = true) => {
    bottomRef.current = true;
    setNearBottom(true);
    setNewCount(0);
    list.current?.scrollToEnd({ animated });
  }, []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', s =>
      setActive(s === 'active'),
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!focused || !latestKey) {
      return;
    }
    if (!initialScroll.current || bottomRef.current || latestSender === uid) {
      const animate = initialScroll.current;
      initialScroll.current = true;
      const frame = requestAnimationFrame(() => scrollToBottom(animate));
      return () => cancelAnimationFrame(frame);
    }
    setNewCount(n => n + 1);
  }, [latestKey, latestSender, uid, focused, scrollToBottom]);
  const ownRead = chat?.read?.[uid];
  useEffect(() => {
    if (
      !focused ||
      !active ||
      !connected ||
      !visibleIncoming ||
      visibleIncoming <= (ownRead || '')
    ) {
      return;
    }
    let mounted = true;
    markRead(id, uid, visibleIncoming)
      .then(() => {
        if (mounted) {
          setReceiptError('');
        }
      })
      .catch(e => {
        if (mounted) {
          setReceiptError(errorMessage(e));
        }
      });
    return () => {
      mounted = false;
    };
  }, [focused, active, connected, visibleIncoming, ownRead, id, uid]);
  const viewability = useRef({
    itemVisiblePercentThreshold: 55,
    minimumViewTime: 350,
  }).current;
  const onViewable = useCallback(
    ({ viewableItems }: Parameters<NonNullable<FlatListProps<Entry>['onViewableItemsChanged']>>[0]) => {
      const keys = viewableItems
        .filter(v => v.isViewable && v.item[1].senderId !== uid)
        .map(v => v.item[0])
        .sort();
      const key = keys.at(-1);
      if (key) {
        setVisibleIncoming(old => (!old || key > old ? key : old));
      }
    },
    [uid],
  );
  function sendText() {
    const text = draft.trim();
    if (!text) {
      return;
    }
    try {
      send(peerId, { type: 'text', text });
      setDraft('');
      scrollToBottom();
    } catch (e) {
      Alert.alert('Không gửi được tin', errorMessage(e));
    }
  }
  async function sendLocation() {
    if (locating) {
      return;
    }
    setLocating(true);
    try {
      const coords = await currentLocation();
      send(peerId, {
        type: 'location',
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      scrollToBottom();
    } catch (e) {
      Alert.alert('Gửi vị trí', errorMessage(e));
    } finally {
      setLocating(false);
    }
  }
  function showDetails(key: string, m: Message) {
    const mine = m.senderId === uid;
    const state = deliveryState(key, peerRead, outbox[key]);
    Alert.alert(
      mine ? 'Thông tin tin nhắn' : peerName,
      `${dateDivider(m.createdAt)} · ${timeLabel(m.createdAt)}${
        mine ? `\n${deliveryLabels[state]}` : ''
      }${outbox[key]?.error ? `\n${outbox[key].error}` : ''}`,
      mine && state === 'failed'
        ? [
            { text: 'Đóng', style: 'cancel' },
            { text: 'Gửi lại', onPress: () => retry(key) },
          ]
        : [{ text: 'Đóng' }],
    );
  }
  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={styles.root}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Quay lại danh sách chat"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={26} color={colors.primary} />
        </Pressable>
        <Avatar name={peerName} size={42} online={online} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {peerName}
          </Text>
          <Text style={styles.headerStatus}>
            {online ? 'Đang hoạt động' : 'Hiện không hoạt động'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thông tin cuộc trò chuyện"
          style={styles.iconButton}
          onPress={() =>
            Alert.alert(
              peerName,
              `${
                online ? 'Đang hoạt động' : 'Hiện không hoạt động'
              }\n\nBiểu tượng dấu tích: tin đã gửi. Avatar nhỏ: người nhận đã xem. Nhấn giữ tin nhắn để xem chi tiết.`,
            )
          }
        >
          <Ionicons
            name="information-circle-outline"
            size={25}
            color={colors.primary}
          />
        </Pressable>
      </View>
      {(!connected || !!error || !!receiptError) && (
        <View style={styles.notice}>
          <Ionicons
            name="cloud-offline-outline"
            size={17}
            color={colors.textMuted}
          />
          <Text style={styles.noticeText}>
            {error ||
              receiptError ||
              'Đang kết nối lại. Tin đang gửi sẽ tiếp tục khi có mạng.'}
          </Text>
        </View>
      )}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.flex}>
          <FlatList
            ref={list}
            data={messages}
            keyExtractor={([key]) => key}
            style={styles.flex}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            scrollEventThrottle={32}
            onScroll={({
              nativeEvent: { layoutMeasurement, contentOffset, contentSize },
            }) => {
              const bottom =
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - 90;
              bottomRef.current = bottom;
              setNearBottom(bottom);
              if (bottom) {
                setNewCount(0);
              }
            }}
            onContentSizeChange={() => {
              if (bottomRef.current) {
                list.current?.scrollToEnd({ animated: false });
              }
            }}
            onViewableItemsChanged={onViewable}
            viewabilityConfig={viewability}
            ListHeaderComponent={
              <View style={styles.profile}>
                <Avatar name={peerName} size={82} />
                <Text style={styles.profileName}>{peerName}</Text>
                <Text style={styles.profileSubtitle}>
                  Các bạn đã kết nối trên chat
                </Text>
                <Text style={styles.profileHint}>
                  Gửi lời chào để bắt đầu câu chuyện.
                </Text>
              </View>
            }
            renderItem={({ item: [key, m], index }) => {
              const mine = m.senderId === uid;
              const previous = messages[index - 1]?.[1];
              const next = messages[index + 1]?.[1];
              const newDay =
                !previous ||
                new Date(m.createdAt).toDateString() !==
                  new Date(previous.createdAt).toDateString();
              const newTime =
                !previous || m.createdAt - previous.createdAt > 15 * 60 * 1000;
              const grouped =
                !!previous &&
                previous.senderId === m.senderId &&
                !newDay &&
                m.createdAt - previous.createdAt < 2 * 60 * 1000;
              const groupEnd =
                !next ||
                next.senderId !== m.senderId ||
                next.createdAt - m.createdAt > 2 * 60 * 1000;
              const state = deliveryState(key, peerRead, outbox[key]);
              const failed = mine && state === 'failed';
              const showStatus =
                mine &&
                (groupEnd ||
                  state === 'sending' ||
                  state === 'failed' ||
                  key === lastSeenOwn ||
                  selected === key);
              return (
                <View>
                  {(newDay || newTime) && (
                    <View style={styles.divider}>
                      <Text style={styles.dividerText}>
                        {newDay ? `${dateDivider(m.createdAt)} · ` : ''}
                        {timeLabel(m.createdAt)}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageRow,
                      mine ? styles.outRow : styles.inRow,
                      !grouped && styles.groupStart,
                    ]}
                  >
                    {!mine && (
                      <View style={styles.avatarSlot}>
                        {groupEnd && <Avatar name={peerName} size={28} />}
                      </View>
                    )}
                    <View
                      style={[styles.messageColumn, mine && styles.ownColumn]}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${mine ? 'Bạn' : peerName}: ${
                          m.type === 'location' ? 'Vị trí hiện tại' : m.text
                        }`}
                        onLongPress={() => showDetails(key, m)}
                        onPress={() => {
                          if (m.type === 'location') {
                            Linking.openURL(
                              `https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`,
                            ).catch(() =>
                              Alert.alert('Không mở được Google Maps'),
                            );
                          } else {
                            setSelected(selected === key ? null : key);
                          }
                        }}
                        style={[
                          styles.bubble,
                          mine ? styles.out : styles.in,
                          grouped && (mine ? styles.joinOut : styles.joinIn),
                          failed && styles.failedBubble,
                          m.type === 'location' && styles.locationBubble,
                        ]}
                      >
                        {m.type === 'location' ? (
                          <View>
                            <View style={styles.mapPreview}>
                              <View style={styles.mapRoadOne} />
                              <View style={styles.mapRoadTwo} />
                              <View style={styles.mapPin}>
                                <Ionicons
                                  name="location"
                                  size={28}
                                  color={colors.primary}
                                />
                              </View>
                            </View>
                            <View style={styles.locationContent}>
                              <Text style={styles.locationTitle}>
                                Vị trí hiện tại
                              </Text>
                              <Text style={styles.coordinates}>
                                {m.latitude?.toFixed(5)},{' '}
                                {m.longitude?.toFixed(5)}
                              </Text>
                              <View style={styles.mapAction}>
                                <Text style={styles.mapActionText}>
                                  Mở Google Maps
                                </Text>
                                <Ionicons
                                  name="open-outline"
                                  size={15}
                                  color={colors.primary}
                                />
                              </View>
                            </View>
                          </View>
                        ) : (
                          <Text
                            selectable
                            style={[
                              styles.message,
                              mine && styles.white,
                              failed && styles.failedMessage,
                            ]}
                          >
                            {m.text}
                          </Text>
                        )}
                      </Pressable>
                      <View
                        style={[styles.messageMeta, mine && styles.metaRight]}
                      >
                        <Text style={styles.time}>
                          {timeLabel(m.createdAt)}
                        </Text>
                        {showStatus && (
                          <MessageStatus
                            state={state}
                            peerName={peerName}
                            showAvatar={key === lastSeenOwn}
                          />
                        )}
                      </View>
                      {failed && (
                        <View style={styles.retryRow}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Gửi lại tin nhắn thất bại"
                            style={styles.retryButton}
                            onPress={() => retry(key)}
                          >
                            <Ionicons
                              name="refresh-outline"
                              size={14}
                              color={colors.danger}
                            />
                            <Text style={styles.retryText}>Thử gửi lại</Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Bỏ tin nhắn thất bại"
                            hitSlop={8}
                            onPress={() => dismiss(key)}
                          >
                            <Ionicons
                              name="close"
                              size={17}
                              color={colors.textMuted}
                            />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
          {!nearBottom && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cuộn đến tin mới nhất"
              style={styles.jump}
              onPress={() => scrollToBottom()}
            >
              <Ionicons name="arrow-down" size={18} color={colors.primary} />
              {newCount > 0 && (
                <Text style={styles.jumpText}>Tin nhắn mới</Text>
              )}
            </Pressable>
          )}
        </View>
        <View style={styles.composer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gửi vị trí hiện tại"
            accessibilityState={{ disabled: locating }}
            disabled={locating}
            style={styles.iconButton}
            onPress={() => {
              sendLocation();
            }}
          >
            {locating ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons
                name="location-outline"
                size={27}
                color={colors.primary}
              />
            )}
          </Pressable>
          <View style={styles.inputWrap}>
            <TextInput
              accessibilityLabel="Nội dung tin nhắn"
              style={styles.input}
              placeholder="Nhắn tin…"
              placeholderTextColor={colors.textMuted}
              value={draft}
              onChangeText={setDraft}
              maxLength={4000}
              multiline
              onFocus={() => {
                if (bottomRef.current) {
                  requestAnimationFrame(() => scrollToBottom());
                }
              }}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gửi tin nhắn"
            accessibilityState={{ disabled: !draft.trim() }}
            disabled={!draft.trim()}
            style={[styles.send, !draft.trim() && styles.sendDisabled]}
            onPress={sendText}
          >
            <Ionicons
              name="send"
              size={23}
              color={draft.trim() ? 'white' : colors.textMuted}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1, marginLeft: 4, gap: 3 },
  headerName: { fontSize: 17, fontWeight: '700', color: colors.text },
  headerStatus: { fontSize: 12, color: colors.textMuted },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  noticeText: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  list: { paddingHorizontal: 12, paddingBottom: 12 },
  profile: { alignItems: 'center', paddingTop: 30, paddingBottom: 24, gap: 8 },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 7,
  },
  profileSubtitle: { fontSize: 13, color: colors.textMuted },
  profileHint: { fontSize: 12, color: colors.textMuted },
  divider: { alignItems: 'center', paddingTop: 14, paddingBottom: 18 },
  dividerText: { fontSize: 11, fontWeight: '500', color: colors.textMuted },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 3 },
  outRow: { justifyContent: 'flex-end', paddingLeft: 40 },
  inRow: { justifyContent: 'flex-start', paddingRight: 32 },
  groupStart: { marginTop: 9 },
  avatarSlot: { width: 34, paddingBottom: 25, alignItems: 'flex-start' },
  messageColumn: { maxWidth: '88%', alignItems: 'flex-start' },
  ownColumn: { alignItems: 'flex-end' },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 40,
  },
  out: { backgroundColor: colors.bubbleOut, borderBottomRightRadius: 7 },
  in: { backgroundColor: colors.bubbleIn, borderBottomLeftRadius: 7 },
  joinOut: { borderTopRightRadius: 7 },
  joinIn: { borderTopLeftRadius: 7 },
  message: { fontSize: 16, lineHeight: 23, color: colors.text },
  white: { color: 'white' },
  failedBubble: {
    backgroundColor: '#FFF0EE',
    borderWidth: 1,
    borderColor: '#F5C2BC',
  },
  failedMessage: { color: colors.danger },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
    marginBottom: 3,
    paddingHorizontal: 4,
    minHeight: 18,
  },
  metaRight: { justifyContent: 'flex-end', flexWrap: 'wrap' },
  time: { fontSize: 10, color: colors.textMuted },
  retryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
  },
  retryText: { fontSize: 12, fontWeight: '600', color: colors.danger },
  locationBubble: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
    backgroundColor: colors.softBlue,
    borderWidth: 1,
    borderColor: '#D7E5FD',
    width: 232,
  },
  mapPreview: {
    height: 88,
    backgroundColor: '#E2EFE9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mapRoadOne: {
    position: 'absolute',
    height: 12,
    width: 300,
    backgroundColor: 'white',
    transform: [{ rotate: '-24deg' }],
  },
  mapRoadTwo: {
    position: 'absolute',
    height: 150,
    width: 10,
    backgroundColor: 'white',
    transform: [{ rotate: '-28deg' }],
  },
  mapPin: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    elevation: 2,
  },
  locationContent: { padding: 13, gap: 5 },
  locationTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  coordinates: { fontSize: 12, color: colors.textMuted },
  mapAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  mapActionText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 9,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.background,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 23,
    minHeight: 44,
    maxHeight: 132,
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 17,
    paddingTop: 11,
    paddingBottom: 11,
    color: colors.text,
    maxHeight: 132,
  },
  send: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginLeft: 4,
  },
  sendDisabled: { backgroundColor: colors.surface },
  jump: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    minHeight: 44,
    paddingHorizontal: 16,
    elevation: 3,
  },
  jumpText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
