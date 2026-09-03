# TigerApp — How to reproduce artifacts and run the server

## Reproduce uncommitted artifacts

The backend (`src/TigerApp.Api`) serves the React frontend from `src/TigerApp.Api/wwwroot/`. The wwwroot files are built by Vite and must be copied there before starting the server.

### Steps (from project root `D:\TigerAcademy`):

1. **Install npm dependencies** (only needed once or after `package.json` changes):
   ```bash
   cd tigerapp.client && npm install
   ```

2. **Build the React frontend**:
   ```bash
   cd tigerapp.client && npm run build
   ```
   This produces `tigerapp.client/dist/`.

3. **Copy build output to wwwroot**:
   ```bash
   rm -rf src/TigerApp.Api/wwwroot
   mkdir -p src/TigerApp.Api/wwwroot
   cp -r tigerapp.client/dist/* src/TigerApp.Api/wwwroot/
   ```

4. **Build the .NET backend**:
   ```bash
   cd src/TigerApp.Api && dotnet build
   ```

## Run the server

Single command — serves both frontend and backend on one port:

```bash
cd src/TigerApp.Api && dotnet run --urls http://localhost:5100
```

## Docker

```bash
# Build and run
docker-compose up --build

# Or just build
docker build -t tigerapp .
docker run -p 5100:5100 tigerapp
```

## Routes

### Public Routes (no auth)
| URL | Page |
|-----|------|
| `/` | Landing page with plans, services, FAQ |
| `/plans/:id` | Plan detail page |
| `/consultations` | Consultation booking (phone/in-person) |
| `/login` | Admin login |
| `/register` | User registration |

### Protected Routes (auth required)
| URL | Page |
|-----|------|
| `/profile` | User profile (public layout) |
| `/admin/dashboard` | Admin dashboard |
| `/admin/plans` | Plans management |
| `/admin/consultations` | Consultations management |
| `/admin/orders` | Orders management |
| `/admin/users` | Users management |
| `/admin/content` | Content management |
| `/admin/faqs` | FAQ management |

Default credentials: `09120000000` / `Admin@123`

## Key details

- The API wraps all responses in `{isSuccess, data, errors}`. The frontend `apiClient` interceptor at `tigerapp.client/src/api/apiClient.ts` automatically unwraps `response.data` to `response.data.data` when `isSuccess` is present.
- Database is SQLite, auto-created and seeded on first startup (`src/TigerApp.Api/TigerApp.db`).
- All dates display in Shamsi (Persian calendar).
- The admin endpoints for orders (`/api/orders/all`) populate computed fields like userName, typeName, statusName.
- Auth is phone-based (not email). JWT tokens with refresh support.
