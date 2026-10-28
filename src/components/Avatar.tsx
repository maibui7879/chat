import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
const palette = [
  { bg: '#E0EDFF', ink: '#245AB5' },
  { bg: '#DDF2EA', ink: '#176B51' },
  { bg: '#FFE8DE', ink: '#9A4B29' },
  { bg: '#FBE4EC', ink: '#9E3657' },
  { bg: '#E3EDF1', ink: '#3A6272' },
];
interface Props {
  name: string;
  size?: number;
  online?: boolean;
  label?: string;
}
export function Avatar({ name, size = 48, online = false, label }: Props) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = (
    words.length > 1
      ? words[0][0] + words[words.length - 1][0]
      : words[0]?.slice(0, 2) || '?'
  ).toUpperCase();
  const hash = Array.from(name).reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const tint = palette[hash % palette.length];
  return (
    <View
      accessible
      accessibilityLabel={label || `${name}${online ? ', đang hoạt động' : ''}`}
      style={{ width: size, height: size }}
    >
      <View
        style={[
          styles.avatar,
          {
            height: size,
            width: size,
            borderRadius: size / 2,
            backgroundColor: tint.bg,
          },
        ]}
      >
        <Text
          style={[
            styles.letters,
            {
              fontSize: size * (letters.length > 1 ? 0.31 : 0.4),
              color: tint.ink,
            },
          ]}
        >
          {letters}
        </Text>
      </View>
      {online && (
        <View
          style={[
            styles.dot,
            {
              width: Math.max(12, size * 0.24),
              height: Math.max(12, size * 0.24),
              borderRadius: size,
              borderWidth: size > 40 ? 3 : 2,
            },
          ]}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  letters: { fontWeight: '700' },
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.success,
    borderColor: colors.background,
  },
});
