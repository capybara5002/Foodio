# Biên bản Bàn giao & Tiếp tục Công việc (Nam - Foodio Map)

Bản tài liệu này tổng kết toàn bộ các công việc mà **Nam** đã thực hiện thành công (thuộc mục 5 của bản phân công gốc [PhanCong_CongViec_Foodio_Map.md](file:///d:/Project/Foodio/PhanCong_CongViec_Foodio_Map.md)) và định hướng cụ thể các phần việc chưa làm của **Khánh** và **Minh** để nhóm tiếp tục phát triển dự án.

---

## I. Các công việc Nam đã hoàn thành (100% Core + UI)

Toàn bộ logic vận hành của Chủ quán (Owner) và Quản trị viên (Admin) đã được xây dựng hoàn chỉnh và kiểm thử biên dịch thành công.

### 1. Database & Models Layer (Backend)
- **Trạng thái Duyệt Chủ quán**: Thêm trường `OwnerStatus` (`None`, `Pending`, `Verified`, `Rejected`) vào model `User` để quản lý luồng đăng ký.
- **Dữ liệu đặt bàn**: Thêm `UserId` vào model `Booking` để phục vụ SignalR realtime chat.
- **Notifications**: Tạo bảng `Notifications` lưu trữ các thông báo hệ thống dành cho chủ quán (Đặt bàn mới, Review mới, Phê duyệt).
- **Audit Logs**: Tạo bảng `AuditLogs` ghi lại mọi hành động bảo mật của Admin và Chủ quán.
- **Database Migration**: Tích hợp mã SQL tự động nâng cấp cấu trúc bảng trong [DbInitializer.cs](file:///d:/Project/Foodio/backend/Foodio.API/Data/DbInitializer.cs).

### 2. API & Controller Layer (Backend)
- **Đồng bộ tài khoản**: Endpoint `GET /api/auth/me/{userId}` dùng để đồng bộ nhanh thông tin từ LocalStorage khi có thay đổi từ Admin.
- **Quản lý Thông báo Chủ quán**: Endpoint lấy danh sách và đánh dấu đã đọc (`GET/POST /api/owner/notifications`).
- **Xác nhận đặt bàn & Realtime SignalR**: Tích hợp chèn tin nhắn hệ thống tự động và đẩy realtime qua SignalR khi Chủ quán cập nhật trạng thái đơn đặt bàn.
- **Ghi nhật ký Audit**: Mọi hành động cập nhật thông tin quán, thay đổi trạng thái đặt bàn, phê duyệt/từ chối quán của Admin, và xóa Review đều được lưu trữ vào bảng `AuditLogs`.

### 3. Giao diện Frontend (React / TypeScript)
- **Đồng bộ LocalStorage**: Tích hợp hàm `syncUser` trong `AuthContext.tsx` để cập nhật lập tức trạng thái duyệt của Chủ quán.
- **Bảng điều khiển Chủ quán (OwnerDashboard.tsx)**:
  - **Verification Gate**: Chặn truy cập nếu chưa được duyệt, hiển thị giao diện đăng ký quán.
  - **Notification Center**: Nút chuông thông báo hiển thị số thông báo chưa đọc.
  - **Menu & Dishes**: Ràng buộc giá món ăn phải `>= 0`.
  - **Đánh giá & Báo cáo**: Hiển thị review của quán và chức năng Báo cáo vi phạm (Report).
- **Bảng điều khiển Admin (AdminDashboard.tsx)**:
  - **Nhật ký hệ thống**: Thêm tab **Nhật ký (Audit Logs)** dạng bảng chi tiết, lấy dữ liệu từ endpoint `/api/admin/audit-logs`.
  - **Duyệt/Quản lý chủ quán**: Cho phép thay đổi trực tiếp trạng thái phê duyệt của chủ quán trong modal cấu hình tài khoản.
  - **Kiểm duyệt đánh giá**: Xem toàn bộ reviews của hệ thống và xóa các review vi phạm (tự động ghi log audit).

---

## II. Các phần việc chưa làm cần tiếp tục triển khai (Handoff)

Người nhận nhiệm vụ tiếp theo cần tập trung làm các phần việc của **Khánh (Mục 3)** và **Minh (Mục 4)** để hoàn thiện đồ án:

### 1. Phần việc của Khánh (Core, Geofencing & Audio Guide)
*Mục tiêu: Đưa ứng dụng thành một cẩm nang du lịch ẩm thực tự động thuyết minh theo GPS.*

- [ ] **3.1 Backend Health/Readiness**:
  - Tạo `HealthController.cs` có `/health` và `/health/ready` để kiểm tra kết nối Database & trạng thái SignalR. Trả mã `503` nếu mất kết nối thay vì để ứng dụng crash.
- [ ] **3.2 Chuẩn hóa Public POI API**:
  - Tạo API `GET /api/public/pois` và `GET /api/public/pois/{id}` trả về đầy đủ tọa độ, thông tin món ăn, các trường `AudioPriority`, `GeofenceRadiusMeters`, `AudioUrl` phục vụ offline và geofence.
- [ ] **3.3 LocationService Frontend**:
  - Tạo `frontend/src/services/locationService.ts` hỗ trợ 2 chế độ: GPS thật (`navigator.geolocation`) và Mock bàn phím (phím mũi tên di chuyển trên bản đồ).
- [ ] **3.4 GeofenceEngine**:
  - Tạo `frontend/src/services/geofenceEngine.ts` để tự động đo khoảng cách (dùng công thức Haversine) giữa vị trí người dùng và các quán ăn. Trigger sự kiện khi đi vào bán kính của quán ăn (cooldown 5 phút).
- [ ] **3.5 NarrationEngine & Audio Trigger**:
  - Tạo `frontend/src/services/narrationEngine.ts` tự động phát âm thanh thuyết minh quán khi Geofence kích hoạt. Ưu tiên phát file `audioUrl` có sẵn, nếu không có thì gọi TTS (Text-to-Speech).
- [ ] **3.6 Backend Audio/Narration API**:
  - Tạo endpoint `POST /api/audio/narration` ở Backend để generate văn bản thuyết minh từ thông tin quán (Gemini API hoặc Template) trước khi chuyển thành tiếng nói.

### 2. Phần việc của Minh (Public UI, Offline MVP & i18n)
*Mục tiêu: Đảm bảo trải nghiệm người dùng tối ưu khi mất kết nối mạng và chuẩn hóa đa ngôn ngữ.*

- [ ] **4.1 Offline Banner**:
  - Tạo `frontend/src/components/Common/OfflineBanner.tsx` lắng nghe sự kiện mạng (`window.online`/`offline`) để hiển thị banner cảnh báo nhẹ nhàng trên đầu ứng dụng.
- [ ] **4.2 IndexedDB Cache MVP**:
  - Tạo `frontend/src/services/offlineStore.ts` để lưu trữ tạm thời danh sách quán ăn (`restaurants`), tour ẩm thực (`audioTours`) xuống trình duyệt. Khi mất mạng vẫn hiển thị được dữ liệu từ bộ nhớ đệm.
- [ ] **4.3 Service Worker App Shell**:
  - Cấu hình file manifest, register service worker (`sw.js`) để cache các file tĩnh (HTML, JS, CSS) giúp ứng dụng có thể tải lên ngay cả khi hoàn toàn offline.
- [ ] **4.4 Polish Public Detail UI**:
  - Tích hợp nút "Viết đánh giá" trực tiếp vào trang chi tiết quán ăn, loại bỏ tab Review cũ trên navbar. Đảm bảo form gửi đánh giá cập nhật ngay điểm số của quán ăn.
- [ ] **4.5 Search + Map UX**:
  - Polish thanh tìm kiếm trên map. Đảm bảo tìm kiếm tiếng Việt không dấu vẫn khớp và khi nhấn vào gợi ý, bản đồ tự pan (di chuyển) tới quán ăn đó.

---

## III. Trạng thái Build & Biên dịch hiện tại

- **Backend**: Đã chạy `dotnet build` tại thư mục `backend/Foodio.API` -> Thành công không có lỗi/cảnh báo.
- **Frontend**: Đã chạy `npm run build` tại thư mục `frontend` -> Biên dịch thành công, đóng gói thư mục `dist` hoàn tất.
