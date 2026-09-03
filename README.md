# 🐯 TigerApp

پلتفرم آنلاین مشاوره و انتخاب رشته کنکور — از فروش پکیج‌های مشاوره و طرح‌ها گرفته تا مدیریت کامل محتوای سایت، سفارش‌ها، پرداخت‌ها و کاربران از یک پنل ادمین اختصاصی.

> برای مستندات کسب‌وکاری و وایرفریم‌های اولیه پروژه به [PROPOSAL.md](PROPOSAL.md) مراجعه کنید.

---

## 📋 فهرست

- [معرفی](#-معرفی)
- [تکنولوژی‌ها](#️-تکنولوژیها)
- [معماری پروژه](#-معماری-پروژه)
- [ساختار پوشه‌ها](#-ساختار-پوشهها)
- [پیش‌نیازها](#-پیشنیازها)
- [راه‌اندازی محلی (بدون Docker)](#-راهاندازی-محلی-بدون-docker)
- [راه‌اندازی با Docker Compose](#-راهاندازی-با-docker-compose)
- [اجرای مستقل ایمیج (بدون دیتابیس داخل ایمیج)](#-اجرای-مستقل-ایمیج-بدون-دیتابیس-داخل-ایمیج)
- [ویزارد نصب اولیه](#-ویزارد-نصب-اولیه)
- [نقش‌های کاربری و پنل ادمین](#-نقشهای-کاربری-و-پنل-ادمین)
- [متغیرهای محیطی](#-متغیرهای-محیطی)
- [تست‌ها](#-تستها)
- [اسکریپت‌های بیلد](#-اسکریپتهای-بیلد)
- [استقرار (Deployment)](#-استقرار-deployment)

---

## 🎯 معرفی

TigerApp به داوطلبان کنکور امکان می‌دهد پکیج‌های مشاوره را مرور و خریداری کنند، در جلسات مشاوره (تلفنی/حضوری/آنلاین) رزرو کنند، پرداخت را از طریق درگاه آنلاین (زرین‌پال) یا کارت‌به‌کارت با رسید انجام دهند و پروفایل تحصیلی خود را مدیریت کنند. تیم پشت صحنه (ادمین، مشاور، مدیر محتوا) از یک پنل مدیریتی کامل برای مدیریت کاربران، سفارش‌ها، تراکنش‌ها، طرح‌ها، مشاوره‌ها، محتوای صفحات، منو و سوالات متداول استفاده می‌کند.

---

## 🛠️ تکنولوژی‌ها

| لایه | تکنولوژی |
|---|---|
| **Backend** | ASP.NET Core 10 (Web API)، Clean Architecture + CQRS با MediatR |
| **دیتابیس** | PostgreSQL 17 + Entity Framework Core 10 |
| **احراز هویت** | JWT (Access + Refresh Token)، هش پسورد با BCrypt |
| **لاگینگ** | Serilog (Console + فایل روزانه) |
| **مستندات API** | Swagger / OpenAPI (فقط در Development) |
| **Frontend** | React 19 + TypeScript + Vite 8 |
| **استایل** | Tailwind CSS 4 + کتابخانه کامپوننت اختصاصی (`design-system`) |
| **مسیریابی** | React Router 7 |
| **درگاه پرداخت** | زرین‌پال (آنلاین) + کارت‌به‌کارت با آپلود رسید |
| **کانتینر** | Docker + Docker Compose (چندمرحله‌ای: build فرانت → build بک‌اند → ایمیج نهایی) |

---

## 🏗️ معماری پروژه

بک‌اند بر اساس **Clean Architecture** در چهار لایه مجزا نوشته شده و از الگوی **CQRS** (با MediatR) برای جدا کردن دستورها (Command) و پرس‌وجوها (Query) استفاده می‌کند:

```
TigerApp.Domain          → موجودیت‌ها (Entities)، Enum‌ها، اینترفیس‌های Repository — بدون وابستگی به لایه دیگر
        ↑
TigerApp.Application      → Features (Commands/Queries/Handlers/DTOs)، قوانین کسب‌وکار، اعتبارسنجی
        ↑
TigerApp.Infrastructure   → پیاده‌سازی Repository‌ها با EF Core، JWT، هش پسورد، سرویس فایل
        ↑
TigerApp.Api               → Controllers، Middleware، احراز هویت، Swagger، سرو کردن SPA
```

هر Feature بک‌اند (مثل `Users`، `Orders`، `Plans`، `Consultations`، `Content`، `FAQs`) زیرپوشه‌ای در `TigerApp.Application/Features` دارد که شامل `Commands`، `Queries` و `DTOs` مخصوص خودش است.

فرانت‌اند یک **SPA تک‌صفحه‌ای** است که در Production داخل `wwwroot` همان API سرو می‌شود؛ در حالت توسعه، Vite با پراکسی درخواست‌های `/api` را به بک‌اند (`http://localhost:5100`) هدایت می‌کند.

---

## 📁 ساختار پوشه‌ها

```
TigerAcademy/
├── src/
│   ├── TigerApp.Domain/          # Entities, Enums, Repository interfaces
│   ├── TigerApp.Application/     # CQRS Features (Commands/Queries/DTOs)
│   ├── TigerApp.Infrastructure/  # EF Core, Repositories, Auth, Services
│   └── TigerApp.Api/             # Controllers, Middleware, Installation Wizard, Program.cs
├── tigerapp.client/              # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── api/                  # axios client
│   │   ├── auth/                 # AuthContext
│   │   ├── components/           # کامپوننت‌های مشترک (Layout, DatePicker, ...)
│   │   ├── design-system/        # کتابخانه UI اختصاصی (Button, Card, Modal, Pagination, ...)
│   │   └── pages/                # صفحات عمومی و پنل ادمین
│   └── tests/                    # تست‌های واحد فرانت (Node test runner)
├── tests/
│   ├── TigerApp.MenuTests/       # چک‌های اجراشدنی (dotnet run) روی حذف دائمی آیتم‌های منو
│   ├── TigerApp.UnitTests/       # رزرو شده برای تست واحد (فعلاً خالی)
│   ├── TigerApp.IntegrationTests/# رزرو شده برای تست یکپارچگی (فعلاً خالی)
│   └── TigerApp.ArchTests/       # رزرو شده برای تست قوانین معماری (فعلاً خالی)
├── Dockerfile                    # بیلد چندمرحله‌ای (فرانت → بک‌اند → ایمیج نهایی)
├── docker-compose.yml            # PostgreSQL + سرویس TigerApp
├── build.sh / build.bat          # بیلد فرانت + کپی به wwwroot + بیلد بک‌اند
├── TigerApp.sln                  # سولوشن اصلی (چهار پروژه لایه‌بندی‌شده)
└── PROPOSAL.md                   # مستندات کسب‌وکاری و وایرفریم اولیه
```

> پوشهٔ `TigerApp.Server` باقی‌ماندهٔ اسکفولد اولیهٔ Visual Studio است و در معماری فعلی استفاده نمی‌شود؛ بک‌اند واقعی همیشه در `src/TigerApp.Api` است.

---

## ✅ پیش‌نیازها

- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/) و npm
- [PostgreSQL 17](https://www.postgresql.org/download/) (یا از طریق Docker)
- (اختیاری) [Docker](https://www.docker.com/) و Docker Compose برای اجرای یکجا

---

## 💻 راه‌اندازی محلی (بدون Docker)

### ۱. کلون و متغیرهای محیطی

```bash
git clone https://github.com/SeniorKian/TigerAcademy.git
cd TigerAcademy
cp .env.example .env   # مقادیر POSTGRES_* و TIGERAPP_JWT_SECRET را با مقادیر واقعی جایگزین کنید
```

بک‌اند این مقادیر را از طریق `DotEnvLoader` مستقیماً از فایل `.env` می‌خواند؛ نیازی به export دستی متغیرها نیست.

### ۲. دیتابیس

یک نمونهٔ PostgreSQL روی `localhost:5432` بالا بیاورید (یا فقط سرویس `postgres` را از Compose اجرا کنید: `docker compose up postgres -d`). دیتابیس/کاربر/پسورد باید با مقادیر `appsettings.Development.json` یا `.env` هم‌خوانی داشته باشد.

### ۳. اجرای بک‌اند

```bash
cd src/TigerApp.Api
dotnet run --urls http://localhost:5100
```

- Swagger: `http://localhost:5100/swagger`
- Health check: `http://localhost:5100/health`

> پورت `5100` را عمداً انتخاب کنید چون سرور توسعهٔ Vite دقیقاً درخواست‌های `/api` را به همین آدرس پراکسی می‌کند (`tigerapp.client/vite.config.ts`).

### ۴. اجرای فرانت‌اند

```bash
cd tigerapp.client
npm install
npm run dev
```

سایت روی `http://localhost:3000` بالا می‌آید.

---

## 🐳 راه‌اندازی با Docker Compose

ساده‌ترین راه برای بالا آوردن کل استک (PostgreSQL + اپلیکیشن) با یک دستور:

```bash
cp .env.example .env   # و مقادیر را تنظیم کنید
docker compose up --build
```

اپلیکیشن (فرانت + بک‌اند به‌صورت یکپارچه) روی `http://localhost:5100` در دسترس است.

---

## 🐋 اجرای مستقل ایمیج (بدون دیتابیس داخل ایمیج)

`Dockerfile` پروژه یک ایمیج **خودکفا** می‌سازد: فقط فرانت (React) + بک‌اند (ASP.NET Core) — هیچ دیتابیسی داخل ایمیج نیست. اگر نمی‌خواهید از `docker-compose.yml` (که یک کانتینر PostgreSQL هم بالا می‌آورد) استفاده کنید و می‌خواهید فقط به یک PostgreSQL موجود (روی هاست، سرور دیگر یا سرویس ابری) وصل شوید، کافی‌ست ایمیج را بسازید و آدرس دیتابیس را حین اجرا از طریق env بدهید:

```bash
# ۱) ساخت ایمیج (شامل بیلد خودکار فرانت + بک‌اند، بدون نیاز به دیتابیس)
docker build -t tigerapp .

# ۲) اجرا با دیتابیس خارجی — آدرس را در یک فایل env مستقل تعریف کنید
cat > .env.docker <<'EOF'
ConnectionStrings__DefaultConnection=Host=YOUR_DB_HOST;Port=5432;Database=tigerapp;Username=tigerapp;Password=YOUR_DB_PASSWORD;Timeout=5
JwtSettings__Secret=YOUR_RANDOM_32PLUS_CHAR_SECRET
EOF

docker run -d --name tigerapp -p 5100:5100 --env-file .env.docker tigerapp
```

> ⚠️ این فایل env با `.env.example` فرق دارد: مقدار `${POSTGRES_DB}` و مشابه آن در `.env.example` فقط توسط **Docker Compose** جایگزین می‌شود؛ `docker run --env-file` چنین جایگزینی‌ای انجام نمی‌دهد، پس در این حالت باید کانکشن‌استرینگ را کامل و به‌صورت مقدار نهایی (literal) بنویسید.

سلامت کانتینر روی `http://localhost:5100/health` (با `HEALTHCHECK` داخل خود ایمیج) قابل بررسی است — نیازی به Compose برای healthcheck نیست.

---

## 🧙 ویزارد نصب اولیه

اولین باری که اپلیکیشن اجرا می‌شود (چه محلی، چه در Docker)، هیچ دیتابیسی migrate یا کاربر ادمینی ساخته نشده است. تا زمانی که نصب کامل نشود، `InstallationGateMiddleware` تمام درخواست‌های API را با وضعیت `503` و کد `installation_required` مسدود می‌کند.

برای تکمیل نصب:

1. مرورگر را روی مسیر ریشهٔ سایت باز کنید — به‌طور خودکار به `/install` هدایت می‌شوید.
2. اتصال به PostgreSQL را تست کنید.
3. اطلاعات حساب ادمین اول (شماره موبایل، رمز عبور و ...) را وارد کنید.
4. با تکمیل ویزارد، migration‌ها اجرا و فایل قفل نصب (`App_Data/installed.lock`) ساخته می‌شود و اپلیکیشن برای همیشه از حالت نصب خارج می‌شود.

---

## 👥 نقش‌های کاربری و پنل ادمین

| نقش | دسترسی |
|---|---|
| **User** | پروفایل شخصی، خرید طرح/مشاوره، پیگیری سفارش‌ها |
| **Consultant (مشاور)** | مدیریت مشاوره‌ها، سفارش‌ها، تراکنش‌ها و مشاهدهٔ کاربران |
| **ContentManager (مدیر محتوا)** | مدیریت طرح‌ها، محتوای صفحات، سوالات متداول و منوی سایت |
| **Admin (مدیر کل)** | دسترسی کامل به همهٔ بخش‌ها از جمله مدیریت نقش/وضعیت کاربران و تنظیمات سیستم |

ماژول‌های پنل ادمین (`/admin/*`): داشبورد، طرح‌ها، مشاوره‌ها، سفارش‌ها، تراکنش‌ها، کاربران، محتوا، سوالات متداول، منو و تنظیمات — همگی با جستجو، فیلتر چندگانه و صفحه‌بندی سمت سرور.

---

## 🔐 متغیرهای محیطی

مقادیر کلیدی در `.env` (نمونه در [.env.example](.env.example)):

| متغیر | توضیح |
|---|---|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | مشخصات دیتابیس PostgreSQL |
| `TIGERAPP_JWT_SECRET` | کلید امضای JWT — حداقل ۳۲ کاراکتر تصادفی، حتماً پیش از Production تغییر کند |
| `ConnectionStrings__DefaultConnection` | Connection string کامل (برای اجرای مستقیم dotnet override می‌شود؛ در Docker هاست به `postgres` تغییر می‌کند) |
| `JwtSettings__Secret` | همان مقدار `TIGERAPP_JWT_SECRET` که ASP.NET Core آن را می‌خواند |

---

## 🧪 تست‌ها

```bash
# چک‌های اجراشدنی منو (روی SQLite در حافظه؛ به دیتابیس واقعی وصل نمی‌شود)
dotnet run --project tests/TigerApp.MenuTests/TigerApp.MenuTests.csproj

# تست‌های فرانت‌اند
cd tigerapp.client
npm test
npm run lint
npm run build   # شامل type-check با tsc -b
```

پوشه‌های `tests/TigerApp.UnitTests`، `TigerApp.IntegrationTests` و `TigerApp.ArchTests` برای توسعهٔ آینده رزرو شده‌اند و فعلاً خالی‌اند.

---

## 📦 اسکریپت‌های بیلد

`build.sh` (لینوکس/مک) و `build.bat` (ویندوز) فرانت را بیلد کرده، خروجی را در `src/TigerApp.Api/wwwroot` کپی و سپس بک‌اند را بیلد می‌کنند — همان چیزی که `Dockerfile` هم به‌صورت چندمرحله‌ای انجام می‌دهد.

```bash
./build.sh
```

---

## 🚀 استقرار (Deployment)

`Dockerfile` یک ایمیج تک‌مرحله‌ای نهایی می‌سازد که هم API و هم فایل‌های استاتیک فرانت را سرو می‌کند (پورت `5100`، health check روی `/health`). برای Production:

1. `.env` را با مقادیر واقعی (پسورد قوی دیتابیس، `TIGERAPP_JWT_SECRET` تصادفی) پر کنید.
2. `docker compose up --build -d` را روی سرور اجرا کنید.
3. پشت یک ریورس‌پروکسی (Nginx/Caddy) با HTTPS قرار دهید.
4. ویزارد نصب (`/install`) را یک‌بار تکمیل کنید.
