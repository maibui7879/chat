# Minh chứng nộp bài

Hạn theo đề: 17:00 ngày 28/10/2026. Các mục dưới cần thực hiện sau khi cấu hình Firebase thật. Không sử dụng ảnh dữ liệu giả thay cho minh chứng.

## Ảnh cần chụp

1. Màn hình Đăng ký đủ 4 trường.
2. Home của A có badge chưa đọc: để A ở Home, B gửi 2 tin.
3. Danh bạ A: B đang mở ứng dụng (Online); đưa B về background để kiểm tra Offline rồi mở lại.
4. Chat có ít nhất một tin thường mỗi bên, thời gian và tin vị trí. Chạm vị trí xác nhận Maps mở đúng tọa độ.
5. Firebase Console → Realtime Database → Data: mở `conversations/{id}/messages`, để thấy senderId, type, text/tọa độ và createdAt. Có thể chụp thêm users và read.

## Video 1–2 phút trên hai máy

- 0:00–0:15: hai emulator/thiết bị cùng xuất hiện, A và B đăng nhập bằng hai tài khoản khác nhau.
- 0:15–0:35: A mở Danh bạ, thấy B Online và mở chat. B gửi tin; tin xuất hiện bên A ngay, A trả lời và phía B nhận ngay.
- 0:35–0:55: A về Home. B gửi 2 tin; chỉ rõ badge tăng và tin cuối/thứ tự cập nhật. A mở cuộc trò chuyện rồi quay lại Home để thấy badge về 0.
- 0:55–1:20: A nhấn 📍, cấp quyền, gửi vị trí. B nhận và chạm mở Google Maps. Nếu máy ảo chưa có tọa độ, đặt Location trước khi quay.
- 1:20–1:40: B về background; A xem trạng thái chuyển Offline. B mở lại → Online.
- 1:40–2:00: A đăng xuất từ Cài đặt và quay lại Đăng nhập. Có thể chuyển sang Firebase Console để thấy dữ liệu đã ghi.

## Đóng gói

Nộp mã nguồn gồm src, android, ios, cấu hình npm và lockfile, database.rules.json, firebase.json, README. Loại node_modules, .git, .cache, android/.gradle, android/build, android/app/build, ios/Pods, ios/build và local.properties. Không nộp service account, private key hoặc thông tin ký release.

Ảnh/video chưa được tạo trong phiên phát triển: chưa có cấu hình/tài khoản Firebase và chỉ phát hiện một emulator đang kết nối. Cần quay/chụp thật sau khi hoàn tất cấu hình.
