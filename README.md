# Chat Firebase — Bài thực hành tiếp theo Bài 4

Ứng dụng React Native CLI, React Navigation, Firebase JS SDK Authentication + Realtime Database và Geolocation. Không dùng Expo. Dữ liệu màn hình lấy từ Firebase; không có chế độ giả lập chat.

## 1. Cấu hình Firebase (bắt buộc)

1. Truy cập https://console.firebase.google.com, tạo project và đăng ký một **Web app** để lấy cấu hình Firebase JS SDK (không cần google-services.json cho cách tích hợp này).
2. Authentication → Sign-in method → bật **Email/Password**.
3. Build → Realtime Database → Create database. Sao chép URL chính xác của database, gồm cả khu vực nếu có.
4. Sao chép [firebaseConfig.example.ts](src/services/firebaseConfig.example.ts) thành `src/services/firebaseConfig.ts` (PowerShell: `Copy-Item src/services/firebaseConfig.example.ts src/services/firebaseConfig.ts`). Nếu đã có cấu hình local, giữ nguyên tệp đó. Điền `apiKey`, `authDomain`, `databaseURL`, `projectId`, `appId` trong [firebaseConfig.ts](src/services/firebaseConfig.ts). Đây là cấu hình client; quyền truy cập được kiểm soát bằng Rules. Không đưa service-account/private key vào ứng dụng.
5. Realtime Database → Rules: dán nội dung [database.rules.json](database.rules.json), nhấn **Publish**. Hoặc dùng Firebase CLI: `firebase login`, `firebase use --add`, `firebase deploy --only database`.
6. Không có tệp luật của giảng viên trong thư mục được cung cấp. Luật kèm dự án là bộ luật dành cho cấu trúc dữ liệu hiện tại; nếu có luật bắt buộc khác, cần đối chiếu schema trước khi thay.

Không mở `.read`/`.write` công khai. Người dùng đã đăng nhập đọc danh bạ và trạng thái; chỉ thành viên đọc cuộc trò chuyện, người gửi tạo tin của mình, chủ tài khoản cập nhật mốc đã đọc. Tin nhắn đã ghi không được sửa/xóa qua client. Hồ sơ công khai chỉ có tên, không chứa email/mật khẩu.

Truy vấn Home dùng hai trường cố định `userA`, `userB` với `equalTo(uid)`. Rules đã khai báo index cho cả hai trường. Mỗi hội thoại mới ghi metadata và members nguyên tử; hai listener được hợp nhất và cùng hủy khi cleanup. Nếu có dữ liệu từ phiên bản cũ chưa có userA/userB, cần bổ sung hai trường theo UID thành viên (sắp xếp tăng dần) bằng Firebase Console trước khi hiển thị trên Home.

## 2. Chạy ứng dụng

Yêu cầu Node >= 22.11, JDK/Android SDK tương thích React Native 0.87.1. Dùng bản debug để thực hành.

```sh
npm ci
npm start
```

Mở terminal khác:

```sh
npm run android
```

iOS cần macOS/Xcode, chạy `bundle install`, `cd ios`, `bundle exec pod install`, rồi từ thư mục gốc `npm run ios`. Quyền vị trí Android/iOS đã khai báo. Phải build lại sau khi cài dependency native; Fast Refresh không đủ.

Cài hai thiết bị: dùng `adb devices` lấy ID rồi chạy `npm run android -- --device ID` lần lượt cho từng máy. Có thể xem tùy chọn CLI bằng `npx react-native run-android --help`. Với Android nối USB/emulator, dùng `adb -s ID reverse tcp:8081 tcp:8081` nếu máy không kết nối Metro.

## 3. Cách sử dụng

- Đăng ký họ tên, email, mật khẩu >= 6 ký tự và xác nhận mật khẩu. Firebase tự đăng nhập khi đăng ký thành công; phiên được lưu bằng AsyncStorage.
- Đăng nhập bằng email/mật khẩu; lỗi được hiển thị trên biểu mẫu. Nếu tạo tài khoản đã thành công nhưng lưu hồ sơ bị lỗi mạng, đăng nhập lại để phục hồi hồ sơ.
- Danh bạ hiển thị người đã đăng ký, loại bản thân, hỗ trợ tìm tên; chạm một người để chat.
- Online khi ứng dụng ở foreground và kết nối Database; background/đăng xuất đánh dấu offline. `onDisconnect` xử lý mất kết nối/đóng ứng dụng, có thể có độ trễ phát hiện của Firebase. Mỗi phiên có khóa riêng nên nhiều thiết bị không ghi đè trạng thái nhau.
- Gửi văn bản hoặc nút 📍 để gửi GPS. Nếu từ chối quyền sẽ có thông báo. Máy ảo cần đặt tọa độ trong Extended Controls → Location; iOS Simulator dùng Features → Location. Chạm tin vị trí để mở Google Maps.
- Home sắp xếp theo thời điểm tin cuối; số chưa đọc chỉ đếm tin nhận sau mốc đã xem, về 0 khi mở chat. Khi chat đang mở/foreground, tin đến cũng được đánh dấu đã đọc.
- Đăng xuất tại Cài đặt quay lại Đăng nhập, không thể Back trở lại chat.

Bản Bài 4 hiện có trong workspace chỉ có tab Tin nhắn và Cài đặt, không có màn hình Thông báo độc lập để giữ lại. Dòng cài đặt “Thông báo: Bật” được giữ; bài này không bổ sung push notification.

## 4. Cấu trúc dữ liệu

```text
users/{uid}/name
presence/{uid}/{sessionId}: true
conversations/{uidNho_uidLon}/userA: uidNho
conversations/{uidNho_uidLon}/userB: uidLon
conversations/{uidNho_uidLon}/members/{uid}: true
conversations/{id}/messages/{pushId}: {senderId,type,text?,latitude?,longitude?,createdAt}
conversations/{id}/read/{uid}: pushIdCuoiDaXem
```

Timestamp dùng `serverTimestamp()`. ID hội thoại được sắp xếp để hai phía dùng cùng một đường dẫn. Tin nhắn đọc từ snapshot thành danh sách theo khóa, không nối thêm snapshot vào state nên không nhân bản tin. Các listener trả unsubscribe và được hủy khi unmount/đổi tài khoản; listener AppState cũng được hủy. Home dùng avatar chữ cái theo tên.

Để đơn giản cho bài thực hành, Home tải lịch sử của các hội thoại thuộc người dùng để tính unread. Chưa phân trang, chưa có hàng đợi gửi khi khởi động ngoại tuyến, chưa có backend tổng hợp inbox. Tin ở trạng thái gửi chờ máy chủ có thể cần kết nối mạng trở lại. Không lưu email hay mật khẩu trong Database.

## 5. Kiểm tra và minh chứng

```sh
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```

Unit test kiểm tra quy tắc đếm chưa đọc, ID hội thoại hai chiều, thứ tự snapshot và khởi động khi chưa cấu hình Firebase. Các test này không thay thế kiểm thử Firebase/Rules trên máy chủ và hai thiết bị.

Sau khi Publish Rules, kiểm tra trên hai tài khoản: A/B nhắn được hai chiều; tài khoản C không đọc/ghi được đường dẫn chat A-B; không sửa senderId thành UID khác; không ghi tọa độ ngoài giới hạn; chỉ chủ UID cập nhật read/presence. Chưa xác nhận chạy Firebase thật trong phiên phát triển vì chưa có project/config.

Xem [hướng dẫn nộp bài](docs/NOP_BAI.md) cho ảnh và video cần tự ghi bằng dữ liệu thật.


## Cấu hình local và Git

- Cấu hình thật trong `src/services/firebaseConfig.ts` chỉ nằm trên máy bạn và được `.gitignore` bỏ qua. Repository giữ `src/services/firebaseConfig.example.ts` với các giá trị rỗng.
- Khi clone dự án, sao chép tệp mẫu thành tệp cấu hình thật rồi nhập thông tin project của bạn. Không ghi đè cấu hình local đang dùng.
- `.env`, cấu hình Firebase native, service-account JSON, private key, thư mục credentials/secrets và log/cache Firebase được bỏ qua. Các tệp `firebase.json` và `database.rules.json` vẫn được quản lý bằng Git để triển khai cấu hình và luật truy cập.
- Firebase Web API key là cấu hình client, không phải private key và vẫn có trong ứng dụng sau khi build. Bảo vệ dữ liệu bằng Authentication và Database Rules. Không đưa Admin SDK/service account vào ứng dụng.
- `.gitignore` không xóa dữ liệu đã commit trước đó. Nếu private key/service account từng được công khai, cần thu hồi/đổi khóa đó.
