import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { useAuth } from '../context/AuthContext';
import { useChatData } from '../context/ChatContext';
import { errorMessage } from '../services/firebase';
import { colors } from '../theme/colors';
export function SettingsScreen() {
  const { user, logout } = useAuth();
  const { users } = useChatData();
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await logout();
    } catch (e) {
      Alert.alert('Đăng xuất', errorMessage(e));
      setBusy(false);
    }
  }
  return (
    <View style={styles.container}>
      <Text style={styles.name}>
        {users[user!.uid]?.name || user?.displayName}
      </Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.email}>Thông báo: Bật</Text>
      <AppButton
        title={busy ? 'Đang đăng xuất…' : 'Đăng xuất'}
        variant="danger"
        onPress={() => {
          submit();
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.background },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  email: { fontSize: 16, color: colors.textMuted, marginBottom: 24 },
});
