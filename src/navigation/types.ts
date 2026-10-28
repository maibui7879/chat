import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
export type MainTabParamList = {
  Chats: undefined;
  Contacts: undefined;
  Settings: undefined;
};
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ChatDetail: { peerId: string; name: string };
};
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;
