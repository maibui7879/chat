import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger';
  style?: StyleProp<ViewStyle>;
}

const variantColors = {
  primary: colors.primary,
  danger: '#DC2626',
} as const;

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  style,
}: AppButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, { backgroundColor: variantColors[variant] }, style]}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 14,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
