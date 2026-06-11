# Phân Công Công Việc Foodio Map

Nguồn định hướng: `Docs/DanhGia_Foodio_SoVoi_KyThuat_ThamKhao.md`

Mục tiêu của bản phân công này là chia việc cho 3 người: **Khánh**, **Minh**, **Nam**. Khánh nhận nhiều phần core hơn vì có khả năng code nhanh hơn và có công cụ hỗ trợ mạnh hơn. Nam tập trung các phần **Admin** và **Chủ quán/Owner**. Minh phụ trách các phần public UI, offline MVP, i18n và hỗ trợ tích hợp.

## 1. Nguyên Tắc Làm Việc Chung

1. Mỗi người làm trên branch riêng:
   - `feature/khanh-geofence-audio-core`
   - `feature/minh-public-offline-ui`
   - `feature/nam-admin-owner-flow`
2. Không commit `appsettings.json` hoặc `appsettings.Development.json`.
3. Trước khi merge phải chạy:
   - Backend: `dotnet build`
   - Frontend: `npm run build`
4. Không sửa trùng cùng một file nếu không cần thiết. Nếu bắt buộc sửa chung, phải báo trước trong nhóm.
5. Mỗi task nên có checklist rõ:
   - Đã code.
   - Đã build.
   - Đã test flow bằng tay.
   - Đã ghi chú lỗi còn lại.

## 2. Chia Việc Tổng Quan

| Người | Trọng tâm | Mức tải |
|---|---|---:|
| Khánh | Core architecture, geolocation/geofence, audio narration, backend public/audio/health, integration tổng | Cao |
| Minh | Public UI, PWA/offline MVP, IndexedDB cache, polish detail/review/map UX, i18n | Trung bình |
| Nam | Admin dashboard, Owner dashboard, owner approval gate, bookings/reviews management, notifications/audit | Trung bình |

## 3. Công Việc Của Khánh

Khánh phụ trách phần lõi để đưa đồ án từ "map + booking/chat/review" thành "culinary tourism guide" đúng hướng thầy: có location, geofence, audio tự động, backend readiness và API public/audio rõ ràng.

### 3.1 Backend Health/Readiness

Mục tiêu: backend có endpoint kiểm tra trạng thái giống tinh thần tài liệu thầy.

Việc cần làm:

1. Thêm controller mới, ví dụ `HealthController.cs`.
2. Thêm endpoint:
   - `GET /health`
   - `GET /health/ready`
3. `/health` trả:
   - `status: "ok"`
   - `environment`
   - `timestamp`
4. `/health/ready` kiểm tra:
   - kết nối SQL Server.
   - có thể query `Restaurants`.
   - SignalR service đã được register.
5. Nếu DB lỗi, trả HTTP 503 thay vì crash.

Acceptance criteria:

- Truy cập `http://localhost:5000/health` trả 200.
- Truy cập `http://localhost:5000/health/ready` trả 200 khi DB chạy.
- Khi DB tắt, `/health/ready` trả 503 có message rõ.

### 3.2 Chuẩn Hóa Public POI API

Mục tiêu: tạo API public rõ ràng để frontend map/offline/geofence dùng, không phụ thuộc quá nhiều vào route cũ `cravemap`.

Việc cần làm:

1. Tạo hoặc mở rộng controller public:
   - `GET /api/public/pois`
   - `GET /api/public/pois/{id}`
2. Response cần có đủ dữ liệu:
   - `id`
   - `name`
   - `description`
   - `category`
   - `priceRange`
   - `rating`
   - `address`
   - `latitude`
   - `longitude`
   - `image`
   - `openingHours`
   - `dishes`
   - `reviews`
   - `audioPriority`
   - `geofenceRadiusMeters`
   - `audioUrl`
   - `updatedAt`
3. Nếu model chưa có field mới thì thêm migration/schema guard:
   - `AudioPriority int default 0`
   - `GeofenceRadiusMeters int default 30`
   - `Description nvarchar(max) null`
   - `AudioUrl nvarchar(500) null`
   - `UpdatedAt datetimeoffset`
4. Hỗ trợ query:
   - `lang=vi|en`
   - `updatedAfter`
5. Nếu chưa làm delta sync thật, vẫn nhận query nhưng trả full list, ghi chú là MVP.

Acceptance criteria:

- Frontend gọi `/api/public/pois` nhận được danh sách quán.
- Không phá route cũ `/api/cravemap/restaurants`.
- Dữ liệu có đủ tọa độ để geofence chạy.

### 3.3 LocationService Frontend

Mục tiêu: thay vì chỉ keyboard mock, app có service vị trí rõ ràng.

File đề xuất:

- `frontend/src/services/locationService.ts`

Việc cần làm:

1. Tạo type:

```ts
export type LocationMode = 'real' | 'mock';

export interface UserPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  source: LocationMode;
  updatedAt: number;
}
```

2. Implement:
   - `startLocationTracking(mode, onPosition)`
   - `stopLocationTracking()`
   - `requestBestEffortPosition()`
3. Real mode:
   - dùng `navigator.geolocation.watchPosition`.
   - throttle update khoảng 5 giây.
   - nếu user từ chối GPS thì fallback mock.
4. Mock mode:
   - bắt đầu tại `[10.7580, 106.7020]`.
   - arrow keys dịch `0.00015`.
5. Tích hợp vào `PageMap.tsx`.

Acceptance criteria:

- Map vẫn chạy được bằng arrow keys.
- Nếu browser cho GPS, user dot cập nhật theo GPS thật.
- Không làm xuất hiện scrollbar toàn trang map.

### 3.4 GeofenceEngine

Mục tiêu: tự phát hiện user đến gần quán.

File đề xuất:

- `frontend/src/services/geofenceEngine.ts`

Việc cần làm:

1. Implement distance bằng Haversine hoặc Turf.js.
2. Input:
   - user position.
   - restaurant list.
   - config radius mặc định 30m.
3. Rule:
   - nếu distance <= `restaurant.geofenceRadiusMeters || 30` thì đưa vào pending.
   - phải ở trong vùng ít nhất 3 giây mới confirm.
   - sau khi trigger, cooldown 5 phút cho POI đó.
4. Chọn POI tốt nhất theo:
   - `audioPriority` cao nhất.
   - distance gần nhất.
   - rating cao hơn nếu tie.
5. Expose:
   - `checkGeofences(position, restaurants)`
   - `resetCooldown(restaurantId)`
   - `clear()`

Acceptance criteria:

- Khi mock user đi gần marker, console/log hoặc UI báo POI được trigger.
- Không trigger lặp liên tục khi đứng yên.
- Có thể test với các quán quanh Vĩnh Khánh.

### 3.5 NarrationEngine + Audio Trigger

Mục tiêu: khi geofence chọn POI, app tự phát audio narration.

File đề xuất:

- `frontend/src/services/narrationEngine.ts`

Việc cần làm:

1. Fallback order:
   - nếu restaurant có `audioUrl`, phát file audio.
   - nếu không, gọi backend `POST /api/audio/narration`.
   - nếu backend lỗi, dùng text fallback.
   - cuối cùng dùng `window.speechSynthesis`.
2. Tích hợp với `AudioPlayer` hiện có nếu phù hợp.
3. Khi geofence trigger:
   - highlight restaurant đang được phát.
   - mở mini audio player hoặc toast "Đang thuyết minh quán ...".
4. Không phát chồng nhiều audio:
   - nếu đang phát thì queue hoặc bỏ qua trigger mới trong vài giây.

Acceptance criteria:

- Khi đi gần quán bằng arrow keys, app tự đọc mô tả quán.
- User có thể tắt audio.
- Không bị phát 2 voice cùng lúc.

### 3.6 Backend Audio/Narration API

Mục tiêu: không để frontend gọi Gemini trực tiếp lâu dài.

Việc cần làm:

1. Tạo endpoint:
   - `POST /api/audio/narration`
2. Request:

```json
{
  "restaurantId": "oc_oanh",
  "language": "vi"
}
```

3. Response:

```json
{
  "restaurantId": "oc_oanh",
  "language": "vi",
  "text": "...",
  "audioUrl": null,
  "source": "cached|generated|fallback"
}
```

4. MVP:
   - chưa cần gọi Gemini thật.
   - có thể generate text từ restaurant name, category, address, top dishes.
5. Giai đoạn sau:
   - chuyển Gemini API key vào backend env/config.
   - thêm rate limit đơn giản.

Acceptance criteria:

- Frontend gọi được endpoint.
- Không cần `VITE_GEMINI_API_KEY` để narration chạy.
- Text narration không rỗng.

### 3.7 Tích Hợp Tổng Và Review PR

Khánh chịu trách nhiệm review integration cuối:

- Pull code Minh và Nam.
- Chạy backend/frontend.
- Test flow:
  - mở map.
  - search quán.
  - đi mock tới quán.
  - audio tự phát.
  - mở detail.
  - review.
  - booking.
  - chat.
  - owner/admin nhìn thấy dữ liệu.

## 4. Công Việc Của Minh

Minh phụ trách trải nghiệm public-facing: UI, offline MVP, cache dữ liệu, i18n/polish. Công việc của Minh phải bám sát code frontend hiện tại, tránh đụng quá sâu vào backend core của Khánh.

### 4.1 Offline Banner

Mục tiêu: user biết app đang online hay offline.

Việc cần làm:

1. Tạo component:
   - `frontend/src/components/Common/OfflineBanner.tsx`
2. Lắng nghe:
   - `window.online`
   - `window.offline`
3. Hiển thị:
   - online: có thể ẩn.
   - offline: banner nhỏ "Đang dùng dữ liệu offline".
4. Gắn vào `App.tsx`.
5. Không che navbar/map controls.

Acceptance criteria:

- Tắt mạng trong DevTools thấy banner.
- Bật mạng lại banner biến mất.

### 4.2 IndexedDB Cache MVP

Mục tiêu: mất mạng vẫn xem được danh sách quán đã load trước đó.

File đề xuất:

- `frontend/src/services/offlineStore.ts`

Việc cần làm:

1. Dùng IndexedDB native hoặc thư viện nhẹ nếu đã có.
2. Tạo store:
   - `restaurants`
   - `audioTours`
   - `metadata`
3. Functions:
   - `saveRestaurants(restaurants)`
   - `getCachedRestaurants()`
   - `saveAudioTours(tours)`
   - `getCachedAudioTours()`
   - `saveLastSyncInfo(info)`
4. Tích hợp trong `App.tsx`:
   - trước khi fetch API, thử load cache.
   - sau khi fetch thành công, save cache.
   - nếu fetch lỗi, dùng cache.

Acceptance criteria:

- Mở app online một lần.
- Tắt backend hoặc network.
- Refresh frontend vẫn thấy quán từ cache.

### 4.3 Service Worker App Shell MVP

Mục tiêu: có PWA/offline-first tối thiểu để báo cáo đúng hướng thầy.

Việc cần làm:

1. Thêm `manifest.webmanifest`.
2. Thêm icon/app name cơ bản.
3. Thêm `public/sw.js` hoặc dùng Vite PWA nếu nhóm thống nhất.
4. Cache:
   - `/`
   - `index.html`
   - JS/CSS assets
5. Register SW trong `main.tsx` chỉ ở production hoặc có guard rõ.

Acceptance criteria:

- Build production chạy được.
- Browser Application tab thấy service worker.
- Refresh khi offline vẫn hiện app shell.

### 4.4 Public Detail UI Polish

Mục tiêu: detail page đúng flow "review trực tiếp trong quán".

Việc cần làm:

1. Kiểm tra `PageDetail.tsx`.
2. Đảm bảo:
   - nút `Viết đánh giá` nằm trong section review.
   - không còn cần tab Review riêng trên navbar.
   - form review không bị lỗi chữ tiếng Việt.
3. Review form:
   - rating star rõ.
   - comment limit 500.
   - ảnh mẫu hoặc image upload nếu kịp.
4. Sau khi gửi review:
   - review mới lên đầu danh sách.
   - rating quán cập nhật.
   - toast rõ.

Acceptance criteria:

- User vào quán, viết review được.
- Không còn phải qua tab Review ở navbar.
- `npm run build` không lỗi.

### 4.5 Search + Map UX Polish

Mục tiêu: search hiện tại hoạt động tốt và không che UI.

Việc cần làm:

1. Kiểm tra search trong `NavBar.tsx`.
2. Đảm bảo:
   - chỉ hiện trên map.
   - dropdown không bị cắt.
   - tìm kiếm không dấu tiếng Việt vẫn đúng.
   - marker không bị filter mất.
3. Khi click suggestion:
   - chọn quán.
   - map pan tới quán.
   - panel mở.
   - route vẽ.

Acceptance criteria:

- Search `"oc"`, `"Ốc"`, `"oanh"` đều ra đúng.
- Tất cả marker vẫn hiện.

### 4.6 i18n Hoàn Thiện Cho Public Flow

Mục tiêu: các text mới không hardcode lung tung.

Việc cần làm:

1. Thêm key `vi/en` cho:
   - offline banner.
   - geofence/audio toast.
   - write review.
   - close review form.
   - no cached data.
2. Kiểm tra encoding file translation.
3. Không để text lỗi dạng `Báº¡n...`.

Acceptance criteria:

- Chuyển EN/VI không lỗi.
- Không có text mojibake trên UI.

### 4.7 Hỗ Trợ Minh Họa Báo Cáo

Mục tiêu: có ảnh/flow để đưa vào báo cáo/thuyết trình.

Việc cần làm:

1. Chụp hoặc ghi chú các màn:
   - map.
   - detail review.
   - offline banner.
   - geofence audio trigger.
2. Viết ngắn trong README hoặc docs:
   - cách test offline.
   - cách test geofence bằng arrow keys.

## 5. Công Việc Của Nam

Nam phụ trách Admin và Chủ quán/Owner, đúng theo yêu cầu: những phần liên quan tới vận hành hệ thống, duyệt chủ quán, quản lý quán, booking, review, notification và audit.

### 5.1 Owner Verification Gate

Mục tiêu: owner chưa được duyệt thì không được vào dashboard đầy đủ.

Việc cần làm:

1. Kiểm tra `User` model hiện tại.
2. Nếu chưa có, thêm field:
   - `OwnerStatus`: `None | Pending | Verified | Rejected`
   - hoặc dùng `RestaurantId == null` + request status nếu muốn đơn giản.
3. Trong `OwnerDashboard.tsx`:
   - nếu owner chưa có `RestaurantId`, chỉ hiển thị form gửi yêu cầu và trạng thái pending/rejected.
   - nếu owner đã có `RestaurantId`, mới hiển thị dashboard đầy đủ.
4. Backend `OwnerController`:
   - `GET /api/owner/restaurant-request/{ownerId}`
   - `POST /api/owner/restaurant-request`
5. Không cho owner update restaurant nếu không phải quán của mình.

Acceptance criteria:

- Login owner chưa duyệt chỉ thấy màn gửi/chờ duyệt.
- Login owner đã duyệt thấy dashboard.
- Owner A không sửa được quán của Owner B.

### 5.2 Admin Restaurant Request Approval

Mục tiêu: admin duyệt hồ sơ chủ quán rõ ràng.

Việc cần làm:

1. Trong `AdminDashboard.tsx`, thêm tab/section "Yêu cầu chủ quán".
2. Hiển thị danh sách request:
   - tên quán.
   - owner name/email.
   - category.
   - food street.
   - address.
   - status.
   - createdAt.
3. Button:
   - Approve.
   - Reject.
4. Khi approve:
   - gọi `POST /api/admin/restaurant-requests/{id}/approve`.
   - backend tạo/gán restaurant.
   - gán `User.RestaurantId`.
   - request status thành `Approved`.
5. Khi reject:
   - nhập admin note.
   - request status thành `Rejected`.

Acceptance criteria:

- Admin duyệt được owner request.
- Owner refresh thấy trạng thái đổi.
- Nếu approved, owner thấy dashboard quán.

### 5.3 Owner Restaurant Management

Mục tiêu: chủ quán chỉnh thông tin quán của mình.

Việc cần làm:

1. Trong owner dashboard, form edit:
   - name.
   - address.
   - opening hours.
   - price range.
   - description.
   - image.
   - category.
   - food street.
2. Backend endpoint:
   - `GET /api/owner/restaurant/{restaurantId}`
   - `PUT /api/owner/restaurant/{restaurantId}`
3. Validate:
   - name required.
   - latitude/longitude hợp lệ nếu cho sửa.
   - owner chỉ sửa restaurant của mình.
4. Sau khi save:
   - update frontend state.
   - map/detail thấy dữ liệu mới.

Acceptance criteria:

- Owner sửa thông tin quán thành công.
- Public map/detail thấy thông tin mới sau refresh.

### 5.4 Owner Menu Management

Mục tiêu: chủ quán quản lý món ăn.

Việc cần làm:

1. Owner dashboard thêm section menu.
2. Chức năng:
   - thêm món.
   - sửa món.
   - xóa món.
   - bật/tắt `IsAvailable`.
3. Backend có thể dùng `MenuController` hiện tại hoặc route owner riêng.
4. Validate:
   - name required.
   - price >= 0.
   - image optional.

Acceptance criteria:

- Thêm/sửa/xóa món không lỗi.
- Public detail cập nhật signature dishes/menu.

### 5.5 Booking Management Cho Owner

Mục tiêu: owner xử lý booking rõ ràng.

Việc cần làm:

1. Owner dashboard hiển thị bookings theo quán:
   - date.
   - time.
   - guests.
   - seating.
   - status.
   - customer/userId.
2. Status flow:
   - Pending.
   - Confirmed.
   - Rejected.
   - Completed.
   - Cancelled.
3. Button theo status:
   - Pending: Confirm/Reject.
   - Confirmed: Complete/Cancel.
4. Khi status đổi:
   - gọi backend.
   - tạo system chat message nếu có thread.
   - thread sidebar nhảy lên đầu.
   - user nhận realtime nếu đang mở chat.

Acceptance criteria:

- Owner confirm booking được.
- Chat có system message "Booking confirmed".
- User nhìn thấy booking status trong chat.

### 5.6 Review Management Cho Owner Và Admin

Mục tiêu: review vừa là public engagement, vừa là dữ liệu owner/admin quản lý.

Việc cần làm:

1. Owner dashboard xem review của quán mình:
   - rating.
   - author.
   - comment.
   - image.
   - createdAt.
2. Owner không được xóa review trực tiếp, chỉ có thể report nếu muốn.
3. Admin dashboard xem tất cả review.
4. Admin có quyền delete review vi phạm.
5. Khi review mới được tạo:
   - owner dashboard cập nhật sau refresh.
   - nếu kịp, SignalR notification cho owner.

Acceptance criteria:

- Owner xem được review quán mình.
- Admin xóa review được.
- Public detail không còn review đã xóa.

### 5.7 Notification Cho Owner

Mục tiêu: owner biết khi có booking/review/message.

Việc cần làm:

1. Thêm model `Notification` nếu kịp:

```text
Id
UserId
RestaurantId
Type
Title
Body
PayloadJson
IsRead
CreatedAt
```

2. Tạo notification khi:
   - có booking mới.
   - có review mới.
   - admin approve/reject request.
   - có chat message mới.
3. Owner dashboard hoặc navbar hiển thị badge.
4. Endpoint:
   - `GET /api/owner/notifications?ownerId=...`
   - `POST /api/owner/notifications/{id}/read`

Acceptance criteria:

- Owner thấy thông báo khi có booking/review mới.
- Mark as read hoạt động.

### 5.8 Audit Log Cho Admin

Mục tiêu: báo cáo có điểm kỹ thuật vận hành giống tài liệu thầy.

Việc cần làm:

1. Thêm model `AuditLog`.
2. Ghi log khi:
   - admin approve/reject owner request.
   - admin delete review/post.
   - owner update restaurant.
   - owner update booking status.
3. Admin dashboard có tab Audit Logs đơn giản.
4. Log cần có:
   - actor.
   - action.
   - entity type.
   - entity id.
   - timestamp.

Acceptance criteria:

- Sau khi admin duyệt owner request, audit log xuất hiện.
- Sau khi owner sửa quán, audit log xuất hiện.

## 6. Các File Dễ Bị Đụng Nhau

Những file nhiều người có thể sửa, cần báo trước:

| File | Người chính | Ghi chú |
|---|---|---|
| `frontend/src/App.tsx` | Khánh | Minh/Nam cần báo nếu sửa flow global. |
| `frontend/src/pages/PageMap.tsx` | Khánh | Minh chỉ polish UI nếu cần. |
| `frontend/src/pages/PageDetail.tsx` | Minh | Khánh chỉ tích hợp audio nếu cần. |
| `frontend/src/components/NavBar.tsx` | Minh | Không tự thêm lại tab Review cũ. |
| `frontend/src/components/Owner/OwnerDashboard.tsx` | Nam | Người khác tránh sửa. |
| `frontend/src/components/Admin/AdminDashboard.tsx` | Nam | Người khác tránh sửa. |
| `backend/Foodio.API/Data/AppDbContext.cs` | Khánh + Nam | Nếu thêm model phải thống nhất. |
| `backend/Foodio.API/Data/DbInitializer.cs` | Khánh | Nam cần báo nếu thêm bảng. |
| `backend/Foodio.API/Controllers/OwnerController.cs` | Nam | |
| `backend/Foodio.API/Controllers/AdminController.cs` | Nam | |
| `backend/Foodio.API/Controllers/CraveMapController.cs` | Khánh | |

## 7. Thứ Tự Merge Đề Xuất

1. Khánh merge trước phần:
   - health endpoints.
   - public POI API.
   - location/geofence/audio service khung.
2. Minh merge sau:
   - offline banner.
   - IndexedDB cache.
   - detail/review polish.
3. Nam merge sau:
   - owner gate.
   - admin approval.
   - booking/review management.
4. Khánh làm integration cuối:
   - fix conflict.
   - chạy build.
   - test end-to-end.

## 8. Checklist Demo Cuối

Trước khi báo cáo, cả nhóm cần demo được các flow sau:

### Public User

- Mở app.
- Map load quán.
- Search không dấu tiếng Việt.
- Click quán mở panel/detail.
- Đi mock bằng arrow keys tới gần quán.
- Audio tự phát.
- Viết review trong detail.
- Đặt bàn.
- Chat với quán.

### Owner

- Login owner.
- Nếu chưa duyệt: thấy trạng thái hồ sơ.
- Nếu đã duyệt: thấy dashboard.
- Sửa thông tin quán.
- Quản lý menu.
- Xem booking.
- Confirm/reject booking.
- Xem review.
- Nhận notification.

### Admin

- Login admin.
- Xem dashboard.
- Duyệt/reject owner request.
- Quản lý user.
- Quản lý audio tours.
- Xem/xóa review.
- Xem audit logs.

### Offline MVP

- Mở app online lần đầu.
- Tắt backend hoặc network.
- Refresh frontend.
- App vẫn hiện shell và dữ liệu quán cache.
- Banner offline xuất hiện.

## 9. Phạm Vi Có Thể Cắt Nếu Thiếu Thời Gian

Nếu sát deadline, ưu tiên cắt theo thứ tự sau:

1. PMTiles/MapLibre: để future work.
2. Edge-TTS file MP3 thật: dùng `speechSynthesis` trước.
3. Full analytics dashboard: chỉ lưu event table cơ bản.
4. Notification realtime phức tạp: dùng refresh/manual fetch trước.
5. Audit diff before/after chi tiết: chỉ log action/entity trước.
6. Offline queue review/booking: offline chỉ read-only trước.

Không nên cắt:

- Geofence MVP.
- Offline POI cache MVP.
- Owner approval gate.
- Review trực tiếp trong quán.
- Backend health/readiness.

## 10. Kết Luận Phân Công

- **Khánh** làm phần khó và lõi nhất: location/geofence/audio/backend public API/health/integration.
- **Minh** làm phần trải nghiệm public và offline MVP: IndexedDB, service worker, UI polish, i18n.
- **Nam** làm phần vận hành: Admin, Owner, booking/review management, notification, audit.

Nếu ba phần này ghép lại tốt, đồ án sẽ chuyển từ một app map/booking/chat thành hệ thống du lịch ẩm thực có flow gần với tài liệu kỹ thuật của thầy nhưng vẫn giữ được nền C# hiện tại.
