import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';
import { ChatDetailScreen } from '../screens/ChatDetailScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';
const Stack = createNativeStackNavigator<RootStackParamList>();
export function RootNavigator() {
  const { isLoggedIn, loading } = useAuth();
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator accessibilityLabel="Đang khôi phục đăng nhập" />
      </View>
    );
  }
  const screens = (
    <Stack.Navigator
      screenOptions={{ headerTintColor: '#0866FF', headerShadowVisible: false }}
    >
      {isLoggedIn ? (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChatDetail"
            component={ChatDetailScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={LoginScreen}
            options={{ title: 'Đăng ký' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
  return isLoggedIn ? <ChatProvider>{screens}</ChatProvider> : screens;
}
const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
