# Foodio - CraveMap

Foodio là đồ án full-stack về bản đồ khám phá ẩm thực đường phố. Dự án gồm backend ASP.NET Core Web API và frontend React/Vite, tập trung vào trải nghiệm tìm quán ăn, xem bản đồ, đặt bàn, chat với quán, đăng bài cộng đồng, audio tour và các màn hình quản trị cho Admin/Owner.

## Tính năng hiện tại

- Bản đồ quán ăn/POI dùng Leaflet và OpenStreetMap.
- Trang khám phá audio tour, bài đăng cộng đồng và chi tiết quán ăn.
- Đăng nhập, đăng ký và phân quyền `Admin`, `Owner`, `User`, `Guest`.
- Đặt bàn, chọn bàn, quản lý trạng thái bàn và QR đăng nhập nhanh cho khách tại bàn.
- Chat realtime giữa khách và quán bằng SignalR.
- Dashboard Admin: quản lý tài khoản, duyệt yêu cầu mở quán, danh mục, audio tour, kiểm duyệt bài viết/review và audit log.
- Dashboard Owner: cập nhật thông tin quán, món ăn, bài đăng, booking, sơ đồ bàn, QR, thông báo và analytics.
- Hỗ trợ tiếng Việt/tiếng Anh qua i18next và localization backend.
- Offline cache cơ bản cho dữ liệu nhà hàng/audio tour.
- Audio narration nội bộ qua Web Speech API; Google Cloud Translate/Text-to-Speech là tuỳ chọn cho audio guide đa ngôn ngữ.

## Công nghệ

Backend:

- .NET 8, ASP.NET Core Web API
- Entity Framework Core 8
- SQL Server
- SignalR
- Swagger/OpenAPI
- Localization resource `.resx`

Frontend:

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Leaflet / React Leaflet
- SignalR client
- i18next / react-i18next

## Yêu cầu cài đặt

Cài trước các phần sau:

- Git
- .NET 8 SDK
- Node.js 20 LTS hoặc mới hơn
- SQL Server Express/Developer. Mặc định dự án dùng instance `.\SQLEXPRESS`
- SSMS hoặc Azure Data Studio nếu muốn xem database trực quan

Tuỳ chọn:

- Google Cloud API key có bật Translation API và Text-to-Speech API nếu muốn dùng endpoint `/api/audio-guide/narrate`.

## Chạy nhanh từ bản clone mới

### 1. Clone dự án

```powershell
git clone <repo-url>
cd Foodio
```

### 2. Cấu hình backend

Vào thư mục backend:

```powershell
cd backend/Foodio.API
```

Tạo file `appsettings.Development.json`. File này đang nằm trong `.gitignore`, nên người clone mới thường sẽ chưa có.

```powershell
@'
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.\\SQLEXPRESS;Database=FoodioCraveMapDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True"
  },
  "GoogleCloud": {
    "ApiKey": ""
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}
'@ | Set-Content -Encoding UTF8 appsettings.Development.json
```

Nếu SQL Server của bạn không dùng `.\SQLEXPRESS`, hãy sửa `DefaultConnection` cho đúng instance local của bạn.

Google Cloud API key là tuỳ chọn. Có thể để trống nếu chưa dùng audio guide đa ngôn ngữ. Nếu muốn cấu hình bằng biến môi trường thay vì ghi vào file:

```powershell
$env:GOOGLE_CLOUD_API_KEY="your_google_cloud_api_key"
```

Restore, build và chạy API:

```powershell
dotnet restore
dotnet build
dotnet run --launch-profile http
```

Backend sẽ chạy ở:

```text
http://localhost:5000
```

Lần chạy đầu tiên API sẽ tự apply EF Core migrations và seed dữ liệu mẫu vào database `FoodioCraveMapDb`. Không cần chạy SQL script thủ công cho luồng cài đặt bình thường.

Kiểm tra backend:

```powershell
Invoke-RestMethod http://localhost:5000/health
Invoke-RestMethod http://localhost:5000/health/ready
Invoke-RestMethod "http://localhost:5000/api/public/pois?lang=vi"
```

Swagger:

```text
http://localhost:5000/swagger
```

### 3. Cấu hình frontend

Mở terminal thứ hai ở thư mục gốc dự án, rồi chạy:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Frontend chạy ở:

```text
http://localhost:3000
```

Nội dung `.env` mặc định:

```env
VITE_API_URL=http://localhost:5000
```

Nếu đổi port backend, hãy sửa `VITE_API_URL` tương ứng.

## Tài khoản mẫu

Database seed sẵn các tài khoản sau:

| Vai trò | Email | Mật khẩu | Mục đích |
| --- | --- | --- | --- |
| Admin | `admin@foodio.com` | `123456` | Vào `Profile` > `Admin Console` để quản trị hệ thống |
| Owner | `owner@foodio.com` | `123456` | Vào `Profile` > `Owner Dashboard` để quản lý quán đã gán |
| User | `customer@foodio.com` | `123456` | Trải nghiệm đặt bàn, chat, đăng bài, review |

Người dùng mới đăng ký từ frontend sẽ có vai trò `User`. Guest mode được tạo bằng QR từ dashboard Owner.

## Luồng phát triển hằng ngày

Terminal backend:

```powershell
cd backend/Foodio.API
dotnet run --launch-profile http
```

Terminal frontend:

```powershell
cd frontend
npm run dev
```

Mở:

```text
http://localhost:3000
```

## Lệnh kiểm tra trước khi nộp/chấm

Backend:

```powershell
cd backend/Foodio.API
dotnet build
```

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```

`npm run lint` hiện là kiểm tra TypeScript bằng `tsc --noEmit`.

## Cấu trúc thư mục

```text
Foodio/
├── backend/
│   └── Foodio.API/
│       ├── Controllers/        API controllers
│       ├── Data/               AppDbContext, DbInitializer, SQL script tham khảo
│       ├── DTOs/               DTO và mapping extensions
│       ├── Hubs/               SignalR hubs
│       ├── Migrations/         EF Core migrations
│       ├── Models/             Entity models
│       ├── Resources/          File localization .resx
│       ├── Services/           Auth, chat, file, restaurant services
│       └── Program.cs          Cấu hình API, CORS, SignalR, migration
├── frontend/
│   ├── public/                 Service worker, manifest, favicon
│   ├── src/
│   │   ├── api/                API clients
│   │   ├── components/         UI components, Admin/Owner dashboards
│   │   ├── context/            Auth context
│   │   ├── hooks/              React hooks
│   │   ├── i18n/               Translation files
│   │   ├── pages/              App pages
│   │   ├── services/           Offline store, geofence, narration
│   │   └── App.tsx
│   ├── .env.example
│   └── package.json
├── Docs/                       Tài liệu đồ án/thuyết trình nếu có trong workspace
└── README.md
```

## Database

Luồng chính hiện tại dùng EF Core migrations:

- `Program.cs` gọi `DbInitializer.ApplyMigrationsAsync(app.Services)`.
- Khi backend start, database sẽ được tạo/cập nhật theo migrations.
- Dữ liệu mẫu được seed trong `AppDbContext`.

File `backend/Foodio.API/Data/FoodioCraveMap.sql` là script SQL tham khảo/legacy. Chỉ dùng khi bạn thật sự muốn tạo database thủ công trong SSMS.

Nếu database local bị lệch schema trong lúc phát triển, cách sạch nhất là xoá database dev rồi chạy lại API để migration tạo mới:

```sql
ALTER DATABASE FoodioCraveMapDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE FoodioCraveMapDb;
```

Chỉ chạy lệnh trên với database local/dev vì sẽ xoá toàn bộ dữ liệu.

## API chính

Một số endpoint thường dùng:

```text
GET  /health
GET  /health/ready
POST /api/auth/login
POST /api/auth/register
GET  /api/public/pois?lang=vi
GET  /api/cravemap/restaurants
GET  /api/cravemap/categories
GET  /api/cravemap/food-streets
GET  /api/cravemap/community-posts
POST /api/cravemap/community-posts
GET  /api/cravemap/chat-threads
POST /api/cravemap/chat-threads/ensure
POST /api/cravemap/chat-threads/{threadId}/messages
POST /api/cravemap/bookings
POST /api/audio/narration
POST /api/audio-guide/narrate
```

SignalR hub:

```text
/hubs/chat
```

## Lỗi thường gặp

Không kết nối được SQL Server:

- Kiểm tra SQL Server service đã chạy.
- Kiểm tra instance có đúng `.\SQLEXPRESS` không.
- Nếu dùng instance khác, sửa `DefaultConnection` trong `appsettings.Development.json`.

Frontend báo không gọi được API:

- Đảm bảo backend đang chạy ở `http://localhost:5000`.
- Kiểm tra `frontend/.env` có `VITE_API_URL=http://localhost:5000`.
- Sau khi sửa `.env`, tắt và chạy lại `npm run dev`.

Port `3000` bị chiếm:

- Backend đã cấu hình CORS cho `3000` và `5173`.
- Có thể chạy frontend bằng port 5173:

```powershell
npx vite --host=0.0.0.0 --port=5173
```

Audio guide đa ngôn ngữ trả `503`:

- Chưa cấu hình `GoogleCloud:ApiKey` hoặc biến môi trường `GOOGLE_CLOUD_API_KEY`.
- Tính năng audio narration cơ bản của map vẫn có fallback qua Web Speech API của trình duyệt.

## Ghi chú bảo mật

- Không commit `.env`, `appsettings.json`, `appsettings.Development.json` hoặc API key thật.
- Các tài khoản seed chỉ phục vụ demo/local development.
- Nếu lỡ đưa API key thật vào file local, hãy rotate key trước khi public repo.
