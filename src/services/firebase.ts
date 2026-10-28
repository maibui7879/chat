import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { firebaseConfig } from './firebaseConfig';

export const configured = Object.values(firebaseConfig).every(Boolean);
const app = configured ? initializeApp(firebaseConfig) : null;
export const auth = app
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : null;
export const database = app ? getDatabase(app) : null;
export function db() {
  if (!database) {
    throw new Error(
      'Chưa cấu hình Firebase trong src/services/firebaseConfig.ts.',
    );
  }
  return database;
}
export function firebaseAuth() {
  if (!auth) {
    throw new Error('Chưa cấu hình Firebase. Vui lòng xem README.');
  }
  return auth;
}
export function errorMessage(error: unknown): string {
  const code = (error as { code?: string }).code;
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email hoặc mật khẩu không đúng.';
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký.';
    case 'auth/invalid-email':
      return 'Email không hợp lệ.';
    case 'auth/weak-password':
      return 'Mật khẩu phải có ít nhất 6 ký tự.';
    case 'auth/network-request-failed':
      return 'Không thể kết nối. Hãy kiểm tra mạng.';
    case 'auth/too-many-requests':
      return 'Quá nhiều lần thử. Vui lòng thử lại sau.';
    default:
      return error instanceof Error
        ? error.message
        : 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }
}
