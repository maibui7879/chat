import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';
export async function currentLocation(): Promise<{
  latitude: number;
  longitude: number;
}> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Quyền vị trí',
        message: 'Cho phép gửi vị trí hiện tại trong cuộc trò chuyện.',
        buttonPositive: 'Cho phép',
        buttonNegative: 'Từ chối',
      },
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error(
        'Bạn đã từ chối quyền vị trí. Có thể bật lại trong Cài đặt thiết bị.',
      );
    }
  }
  Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
  });
  return new Promise((resolve, reject) =>
    Geolocation.getCurrentPosition(
      p => resolve(p.coords),
      e =>
        reject(
          new Error(
            e.code === 1
              ? 'Bạn đã từ chối quyền vị trí.'
              : 'Không lấy được vị trí. Hãy bật GPS và thử lại.',
          ),
        ),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 },
    ),
  );
}
