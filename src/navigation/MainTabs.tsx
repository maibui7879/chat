import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { ChatListScreen } from '../screens/ChatListScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useChatData } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { unreadCount } from '../services/chat';
import { colors } from '../theme/colors';
import type { MainTabParamList } from './types';
const Tab = createBottomTabNavigator<MainTabParamList>();
const chatIcon = ({ color }: { color: string }) => (
  <Ionicons name="chatbubbles-outline" size={24} color={color} />
);
const contactIcon = ({ color }: { color: string }) => (
  <Ionicons name="people-outline" size={24} color={color} />
);
const settingsIcon = ({ color }: { color: string }) => (
  <Ionicons name="settings-outline" size={24} color={color} />
);
export function MainTabs() {
  const { chats } = useChatData();
  const { user } = useAuth();
  const unread = Object.values(chats).reduce(
    (n, c) => n + unreadCount(c, user!.uid),
    0,
  );
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{
          title: 'Đoạn chat',
          headerShown: false,
          tabBarBadge: unread || undefined,
          tabBarIcon: chatIcon,
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ChatListScreen}
        options={{
          title: 'Danh bạ',
          headerShown: false,
          tabBarIcon: contactIcon,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Cài đặt', tabBarIcon: settingsIcon }}
      />
    </Tab.Navigator>
  );
}
