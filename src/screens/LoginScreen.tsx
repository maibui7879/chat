import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
} from 'react-native';
import { AppButton } from '../components/AppButton';
import { LabeledInput } from '../components/LabeledInput';
import { useAuth } from '../context/AuthContext';
import { errorMessage, configured } from '../services/firebase';
import type { RootStackScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
export function LoginScreen({
  navigation,
  route,
}: RootStackScreenProps<'Login'> | RootStackScreenProps<'Register'>) {
  const registering = route.name === 'Register';
  const { login, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (busy) {
      return;
    }
    if (!email.trim() || !password || (registering && !name.trim())) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (registering && password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (registering && password !== confirm) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (registering) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>chat</Text>
        <Text style={styles.title}>
          {registering ? 'Tạo tài khoản' : 'Đăng nhập'}
        </Text>
        <Text style={styles.subtitle}>
          Kết nối và trò chuyện cùng bạn bè.
        </Text>
        {!configured && (
          <Text style={styles.error}>
            Chưa cấu hình Firebase. Xem hướng dẫn trong README.
          </Text>
        )}
        {registering && (
          <LabeledInput
            label="Họ tên"
            value={name}
            onChangeText={setName}
            autoComplete="name"
          />
        )}
        <LabeledInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
        />
        <LabeledInput
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={registering ? 'new-password' : 'current-password'}
        />
        {registering && (
          <LabeledInput
            label="Nhập lại mật khẩu"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
          />
        )}
        {!!error && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}
        <AppButton
          title={
            busy
              ? 'Đang xử lý…'
              : registering
              ? 'Đăng ký'
              : 'Đăng nhập'
          }
          onPress={() => {
            submit();
          }}
        />
        <Pressable
          accessibilityRole="button"
          style={styles.link}
          disabled={busy}
          onPress={() =>
            registering ? navigation.goBack() : navigation.navigate('Register')
          }
        >
          <Text style={styles.linkText}>
            {registering
              ? 'Đã có tài khoản? Đăng nhập'
              : 'Chưa có tài khoản? Đăng ký'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  brand: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 28,
  },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  error: { color: '#B42318', marginBottom: 16 },
  link: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  linkText: { color: colors.primary, fontSize: 15 },
});
