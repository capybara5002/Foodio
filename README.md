# 🍜 Foodio + CraveMap

Foodio is a full-stack food street map application that combines an ASP.NET Core backend with the CraveMap React frontend experience. The app helps users explore street food locations, browse stalls, view menus and reviews, book tables, and use Gemini-powered AI narration for food tours and map interactions.

## 🧱 Tech Stack

**Backend**

- ASP.NET Core Web API
- Entity Framework Core
- Microsoft SQL Server Express
- SQL Server T-SQL seed/setup script
- REST API controllers for CraveMap restaurants, categories, food streets, menu items, chats, bookings, posts, and audio tours

**Frontend**

- React with TypeScript / TSX
- Vite
- OpenStreetMap tile rendering for the map experience
- Gemini API client for generative audio/map narration
- Local `.env` configuration for API URLs and frontend runtime keys

## 📁 Project Structure

```text
Foodio/
├── backend/
│   └── Foodio.API/
│       ├── Controllers/
│       ├── Data/
│       │   ├── AppDbContext.cs
│       │   └── FoodioCraveMap.sql
│       ├── DTOs/
│       ├── Models/
│       ├── Program.cs
│       ├── appsettings.json
│       └── Foodio.API.csproj
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── cravemapApi.ts
│   │   ├── components/
│   │   ├── App.tsx
│   │   ├── data.ts
│   │   ├── main.tsx
│   │   └── types.ts
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── Foodio.sln
└── README.md
```

## ✅ Prerequisites

Install the following before running the project:

- **Node.js** for the React/Vite frontend
- **.NET 8.0 SDK** for the ASP.NET Core backend
- **SQL Server Express** for the local database
- **SQL Server Management Studio (SSMS)** for database setup and inspection
- **Google Gemini API Key** from Google AI Studio for AI narration features

## 🗄️ Database Setup With SSMS

1. Open **SQL Server Management Studio (SSMS)**.

2. Connect using these settings:

   ```text
   Server name: .\SQLEXPRESS
   Authentication: Windows Authentication
   Trust server certificate: Checked
   ```

3. Open the SQL setup script:

   ```text
   backend/Foodio.API/Data/FoodioCraveMap.sql
   ```

4. Execute the script in SSMS.

   This creates the `FoodioCraveMapDb` database, all required tables, primary keys, foreign keys, and seed culinary mock data for restaurants, food streets, categories, menu items, reviews, community posts, chat threads, bookings, and audio tours.

## ⚙️ Backend Setup

1. Navigate to the backend project:

   ```powershell
   cd backend/Foodio.API
   ```

2. Confirm `appsettings.json` contains the local SQL Server Express connection string:

   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=.\\SQLEXPRESS;Database=FoodioCraveMapDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True"
     }
   }
   ```

3. Restore packages:

   ```powershell
   dotnet restore
   ```

4. Build the backend:

   ```powershell
   dotnet build
   ```

5. Run the API:

   ```powershell
   dotnet run
   ```

6. The backend is expected to run locally on:

   ```text
   http://localhost:5000
   ```

7. Test the API:

   ```powershell
   Invoke-RestMethod http://localhost:5000/api/cravemap/restaurants
   ```

## 🎨 Frontend Setup

1. Navigate to the frontend project:

   ```powershell
   cd frontend
   ```

2. Create a local `.env` file:

   ```env
   VITE_API_URL=http://localhost:5000
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

   `VITE_API_URL` points the frontend to the ASP.NET Core backend. `VITE_GEMINI_API_KEY` powers the Gemini narration features in the browser. Because Vite exposes `VITE_*` variables to client-side code, restrict the Gemini key in Google AI Studio for local development use.

3. Install dependencies:

   ```powershell
   npm install
   ```

4. Run the Vite dev server:

   ```powershell
   npm run dev
   ```

5. The frontend runs locally on:

   ```text
   http://localhost:3000
   ```

## 🔌 API Integration

The frontend API client lives here:

```text
frontend/src/api/cravemapApi.ts
```

It reads the backend URL from:

```ts
import.meta.env.VITE_API_URL
```

Main CraveMap API routes:

```text
GET  /api/cravemap/restaurants
GET  /api/cravemap/categories
GET  /api/cravemap/food-streets
GET  /api/cravemap/community-posts
GET  /api/cravemap/chat-threads
GET  /api/cravemap/audio-tours
POST /api/cravemap/community-posts
POST /api/cravemap/chat-threads/{threadId}/messages
POST /api/cravemap/bookings
```

## 🧭 Local Development Flow

Run the backend first:

```powershell
cd backend/Foodio.API
dotnet run
```

Then run the frontend in a second terminal:

```powershell
cd frontend
npm run dev
```

Open the app:

```text
http://localhost:3000
```

## 🧹 Git Hygiene

The repository includes a root `.gitignore` that excludes generated artifacts such as:

- `bin/`
- `obj/`
- `node_modules/`
- `dist/`
- local `.env` files
- IDE folders such as `.vscode/` and `.idea/`

Use `.env.example` as the shared template and keep real secrets out of source control.

## 🧪 Quick Health Check

Use this checklist after cloning:

- ✅ SQL Server Express is running at `.\SQLEXPRESS`
- ✅ `FoodioCraveMap.sql` has been executed in SSMS
- ✅ Backend builds with `dotnet build`
- ✅ Backend runs with `dotnet run`
- ✅ `http://localhost:5000/api/cravemap/restaurants` returns JSON
- ✅ Frontend `.env` contains `VITE_API_URL=http://localhost:5000`
- ✅ Frontend runs with `npm run dev`
- ✅ App opens at `http://localhost:3000`
