# 🍜 Foodio Map

Ứng dụng web bản đồ tương tác dành riêng cho khu phố ẩm thực Vĩnh Khánh — hiển thị thông tin quán ăn theo thời gian thực, kèm audio giới thiệu đa ngôn ngữ.

---

## 🗂️ Cấu trúc dự án

```
Foodio-FoodStreet/
├── Foodio.sln                           # .NET Solution file
├── backend/
│   └── Foodio.API/                      # ASP.NET Core Web API
│       ├── Controllers/
│       │   ├── AuthController.cs        # Đăng nhập / đăng ký
│       │   ├── RestaurantsController.cs # CRUD quán ăn (public + owner)
│       │   ├── MenuController.cs        # CRUD menu quán
│       │   ├── AudioController.cs       # Upload / phát audio
│       │   ├── AdminController.cs       # Quản trị hệ thống
│       │   └── OwnerController.cs       # Chủ quán tự cập nhật
│       ├── Models/
│       │   ├── User.cs                  # Entity người dùng (Guest/Owner/Admin)
│       │   ├── Restaurant.cs            # Entity quán ăn
│       │   ├── MenuItem.cs              # Entity món ăn trong menu
│       │   ├── AudioFile.cs             # Entity file audio (có ngôn ngữ)
│       │   ├── Review.cs                # Entity đánh giá
│       │   └── OpeningHour.cs           # Giờ mở cửa theo ngày
│       ├── DTOs/
│       │   ├── RestaurantDto.cs         # DTO trả về cho client
│       │   ├── MenuItemDto.cs
│       │   ├── UserDto.cs
│       │   ├── AudioDto.cs
│       │   └── ReviewDto.cs
│       ├── Data/
│       │   ├── AppDbContext.cs          # EF Core DbContext + cấu hình bảng
│       │   └── DbInitializer.cs         # Seed data mẫu (quán ăn, tọa độ)
│       ├── Services/
│       │   ├── IRestaurantService.cs    # Interface nghiệp vụ quán ăn
│       │   ├── RestaurantService.cs
│       │   ├── IFileService.cs          # Interface upload/lưu file audio
│       │   ├── FileService.cs
│       │   ├── IAuthService.cs          # Interface xác thực JWT
│       │   └── AuthService.cs
│       ├── Hubs/
│       │   └── RestaurantHub.cs         # SignalR Hub — push real-time tới client
│       ├── Middleware/
│       │   └── ErrorHandlingMiddleware.cs
│       ├── Uploads/
│       │   └── audio/                   # Thư mục lưu file .mp3 do admin upload
│       ├── Program.cs                   # Entry point, DI, Middleware pipeline
│       ├── appsettings.json
│       └── appsettings.Development.json
└── frontend/                            # React + Vite SPA
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── .env.example                     # VITE_API_URL, VITE_MAP_TILE_URL
    └── src/
        ├── main.jsx                     # Bootstrap React app
        ├── App.jsx                      # Router chính (React Router v6)
        ├── api/
        │   ├── restaurantApi.js         # Gọi GET/POST/PUT quán ăn
        │   ├── authApi.js               # Login, register, refresh token
        │   ├── audioApi.js              # Upload audio, lấy danh sách audio
        │   └── menuApi.js               # CRUD menu item
        ├── hooks/
        │   ├── useRestaurants.js        # Fetch + cache danh sách quán
        │   ├── useSignalR.js            # Kết nối và lắng nghe SignalR Hub
        │   ├── useAuth.js               # Trạng thái đăng nhập, role
        │   └── useAudio.js              # Điều khiển phát/dừng audio
        ├── context/
        │   ├── AuthContext.jsx          # Global auth state
        │   └── RestaurantContext.jsx    # Global restaurant list state
        ├── components/
        │   ├── Map/
        │   │   ├── MapView.jsx          # Leaflet map, render toàn bộ marker
        │   │   ├── RestaurantMarker.jsx # Marker custom theo trạng thái quán
        │   │   ├── MapSidebar.jsx       # Panel bên trái — list + filter
        │   │   └── MapControls.jsx      # Nút zoom, locate me
        │   ├── Restaurant/
        │   │   ├── RestaurantCard.jsx   # Card nhỏ trong sidebar list
        │   │   ├── RestaurantDetail.jsx # Popup chi tiết khi click marker
        │   │   ├── RestaurantList.jsx   # Danh sách cuộn trong sidebar
        │   │   ├── AudioPlayer.jsx      # Player + chọn ngôn ngữ audio
        │   │   └── StatusBadge.jsx      # Badge "Đang mở" / "Đóng cửa"
        │   ├── Menu/
        │   │   ├── MenuList.jsx         # Danh sách toàn bộ menu
        │   │   ├── MenuSection.jsx      # Nhóm món (khai vị, món chính...)
        │   │   └── MenuItemCard.jsx     # Một dòng món ăn + giá
        │   ├── Admin/
        │   │   ├── AdminDashboard.jsx   # Tổng quan admin
        │   │   ├── RestaurantManager.jsx# Duyệt / xoá / sửa quán
        │   │   ├── AudioUploader.jsx    # Upload file .mp3 theo ngôn ngữ
        │   │   └── UserManager.jsx      # Quản lý tài khoản owner
        │   ├── Owner/
        │   │   ├── OwnerDashboard.jsx   # Trang chủ chủ quán
        │   │   ├── RestaurantEditor.jsx # Sửa tên, mô tả, ảnh, tọa độ
        │   │   ├── MenuEditor.jsx       # Thêm / sửa / xoá món ăn
        │   │   └── AudioManager.jsx     # Xem audio đã có, yêu cầu admin upload
        │   └── Common/
        │       ├── Navbar.jsx           # Thanh điều hướng + nút đăng nhập
        │       ├── Sidebar.jsx          # Layout sidebar tái sử dụng
        │       ├── LoadingSpinner.jsx
        │       ├── Modal.jsx            # Modal generic
        │       └── LanguageSelector.jsx # Chọn ngôn ngữ audio (VI/EN/JP/KR...)
        └── pages/
            ├── HomePage.jsx             # Trang bản đồ chính
            ├── RestaurantDetailPage.jsx # Trang chi tiết quán (deep link)
            ├── LoginPage.jsx            # Đăng nhập / đăng ký
            ├── AdminPage.jsx            # Trang quản trị (role: Admin)
            ├── OwnerPage.jsx            # Trang chủ quán (role: Owner)
            └── NotFoundPage.jsx         # 404
```

---

## 🛠️ Tech Stack

| Lớp | Công nghệ | Lý do chọn |
|---|---|---|
| **Backend Core** | ASP.NET Core 8 Web API | Yêu cầu đề bài |
| **ORM & Database** | Entity Framework Core + SQL Server | Dùng SQL Server theo yêu cầu |
| **Real-time** | SignalR (built-in .NET) | Push update quán ăn tới client, không cần thư viện ngoài |
| **Auth** | JWT Bearer (đơn giản) | Không cần session, phù hợp SPA |
| **File Storage** | Local disk (`/Uploads/audio/`) | Đủ dùng cho đồ án, không cần S3/Azure |
| **Frontend** | React 18 + Vite | Nhanh, hot reload, ecosystem lớn |
| **Bản đồ** | Leaflet.js + OpenStreetMap | **Miễn phí**, không cần API key, tile sẵn có |
| **Real-time Client** | @microsoft/signalr (npm) | Bắt cặp với SignalR Hub backend |
| **Routing** | React Router v6 | Standard |
| **HTTP Client** | Axios | Quen thuộc, interceptor dễ |
| **Audio** | HTML5 `<audio>` tag | Built-in browser, không cần thư viện |

---

## 🗄️ Database Schema (tóm tắt)

```
Users           → Id, Username, PasswordHash, Role (Guest/Owner/Admin)
Restaurants     → Id, Name, Description, Address, Latitude, Longitude,
                  Phone, ImageUrl, IsOpen, OwnerId (FK→Users)
OpeningHours    → Id, RestaurantId (FK), DayOfWeek, OpenTime, CloseTime
MenuItems       → Id, RestaurantId (FK), Name, Description, Price, Category, ImageUrl
AudioFiles      → Id, RestaurantId (FK), Language, FilePath, CreatedAt
Reviews         → Id, RestaurantId (FK), AuthorName, Rating, Comment, CreatedAt
```

---

## 🔌 API Endpoints chính

```
POST   /api/auth/login
POST   /api/auth/register

GET    /api/restaurants              ← public, trả về tất cả quán + tọa độ
GET    /api/restaurants/{id}         ← chi tiết 1 quán (menu, audio, review)
POST   /api/restaurants              ← Owner/Admin tạo quán
PUT    /api/restaurants/{id}         ← Owner cập nhật quán của mình
PATCH  /api/restaurants/{id}/status  ← Owner toggle mở/đóng cửa → trigger SignalR

GET    /api/restaurants/{id}/menu
POST   /api/restaurants/{id}/menu    ← Owner thêm món

GET    /api/restaurants/{id}/audio
POST   /api/audio/upload             ← Admin upload file .mp3

SignalR Hub: /hubs/restaurant
  → Server push: "RestaurantUpdated" (payload: restaurant object)
  → Server push: "RestaurantStatusChanged" (payload: {id, isOpen})
```

---

## 🗓️ Roadmap 4 tuần

### Tuần 1 — Nền tảng Backend + Database
> **Mục tiêu:** Chạy được API cơ bản, có data mẫu, test bằng Swagger.

| Ngày | Việc cần làm |
|---|---|
| 1–2 | Tạo project ASP.NET Core, cài EF Core + SQL Server, thiết kế Models |
| 3 | Viết `AppDbContext`, tạo Migration đầu tiên |
| 4 | Viết `RestaurantsController` — GET all, GET by id |
| 5 | Viết `AuthController` — login/register bằng JWT đơn giản |
| 6–7 | Test bằng Swagger UI, sửa bug, viết DTOs |

**Deliverable:** Swagger chạy được, GET `/api/restaurants` trả về JSON đúng.

---

### Tuần 2 — SignalR Real-time + Frontend Map
> **Mục tiêu:** Bản đồ hiển thị marker quán ăn, cập nhật live khi status thay đổi.

| Ngày | Việc cần làm |
|---|---|
| 1–2 | Thiết lập React + Vite, cài Leaflet + React-Leaflet, render bản đồ khu Vĩnh Khánh (map trống để tự thêm quán) |
| 3 | Fetch quán từ API, render `RestaurantMarker` lên bản đồ đúng tọa độ |
| 4 | Cài `@microsoft/signalr`, viết `RestaurantHub.cs` phía backend |
| 5 | Viết `useSignalR.js` — lắng nghe event `RestaurantStatusChanged` |
| 6 | Viết `PATCH /api/restaurants/{id}/status` → gọi `hub.Clients.All.SendAsync(...)` |
| 7 | Test end-to-end: Owner đổi status → marker trên map đổi màu ngay |

**Deliverable:** Mở 2 tab trình duyệt — tab 1 là Owner toggle, tab 2 là khách thấy marker đổi màu realtime.

---

### Tuần 3 — Chi tiết quán + Audio đa ngôn ngữ
> **Mục tiêu:** Click vào quán → xem thông tin đầy đủ + nghe audio.

| Ngày | Việc cần làm |
|---|---|
| 1 | Viết `RestaurantDetail.jsx` — popup hoặc sidebar hiển thị thông tin quán |
| 2 | Tích hợp menu: GET `/api/restaurants/{id}/menu`, render `MenuList` |
| 3 | Viết `AudioController` — upload file, lưu vào `/Uploads/audio/`, trả về URL |
| 4 | Viết `AudioPlayer.jsx` + `LanguageSelector.jsx` — chọn ngôn ngữ, phát HTML5 audio |
| 5 | Viết trang `OwnerPage` — `RestaurantEditor`, `MenuEditor` |
| 6 | Viết trang `AdminPage` — `AudioUploader` (chọn quán + ngôn ngữ + file .mp3) |
| 7 | Test toàn bộ luồng: Admin upload → Khách chọn ngôn ngữ → nghe audio |

**Deliverable:** Demo được luồng: Admin upload audio tiếng Anh → khách chọn EN → audio phát.

---

### Tuần 4 — Hoàn thiện + UI + Báo cáo
> **Mục tiêu:** App chạy ổn định, UI đủ dùng, sẵn sàng demo.

| Ngày | Việc cần làm |
|---|---|
| 1 | Review toàn bộ luồng 3 role: Guest / Owner / Admin |
| 2 | Viết `Reviews` — khách để lại đánh giá sao + bình luận |
| 3 | Hoàn thiện UI: `StatusBadge`, `LoadingSpinner`, responsive mobile |
| 4 | Xử lý lỗi cơ bản: 401, 404, mạng mất kết nối SignalR |
| 5 | Nhập thêm data thực (ảnh, tọa độ chính xác các quán Vĩnh Khánh) |
| 6 | Viết báo cáo đồ án — kiến trúc, ERD, API docs |
| 7 | Rehearsal demo — chạy thử toàn bộ use case, fix bug cuối |

**Deliverable:** Demo được trước giảng viên, nộp báo cáo.

---

## 🚀 Hướng dẫn chạy

### Backend
```bash
cd backend/Foodio.API
dotnet restore
dotnet ef database update   # tạo database SQL Server
dotnet run                  # chạy tại https://localhost:7000
# Swagger: https://localhost:7000/swagger
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env        # chỉnh VITE_API_URL=https://localhost:7000
npm run dev                 # chạy tại http://localhost:5173
```

---

## 📦 Packages cần cài

### Backend (NuGet)
```
Microsoft.EntityFrameworkCore.SqlServer
Microsoft.EntityFrameworkCore.Tools
Microsoft.AspNetCore.Authentication.JwtBearer
Microsoft.AspNetCore.SignalR
```

### Frontend (npm)
```
react-leaflet leaflet
@microsoft/signalr
axios
react-router-dom
```

---

## 👥 Phân chia Role

| Role | Quyền |
|---|---|
| **Guest** | Xem bản đồ, xem chi tiết quán, nghe audio, để lại review |
| **Owner** | Guest + cập nhật thông tin quán của mình, thêm/sửa/xoá menu, toggle mở/đóng |
| **Admin** | Owner + quản lý tất cả quán, upload audio, quản lý tài khoản |