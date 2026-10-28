import { StyleSheet, Text, View } from 'react-native';
import type { ChatMessage } from '../data/chats';
import { colors } from '../theme/colors';

export function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <View
      style={[
        styles.bubble,
        message.fromMe ? styles.bubbleOut : styles.bubbleIn,
      ]}>
      <Text style={message.fromMe ? styles.textOut : styles.textIn}>
        {message.text}
      </Text>
      <Text style={message.fromMe ? styles.timeOut : styles.timeIn}>
        {message.time}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleIn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bubbleIn,
  },
  bubbleOut: {
    alignSelf: 'flex-end',
    backgroundColor: colors.bubbleOut,
  },
  textIn: {
    color: colors.text,
    fontSize: 15,
  },
  textOut: {
    color: colors.bubbleOutText,
    fontSize: 15,
  },
  timeIn: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  timeOut: {
    color: '#D6E9FF',
    fontSize: 11,
    marginTop: 4,
  },
});
