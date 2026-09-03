# نصب امن TigerApp روی PostgreSQL

سیستم دیگر SQLite را در زمان اجرا ایجاد نمی‌کند. ساخت schema فقط با مایگریشن EF Core و فقط در ویزارد نصب انجام می‌شود.

## راه‌اندازی با Docker Compose

1. فایل `.env.example` را با نام `.env` کپی کنید.
2. برای `POSTGRES_PASSWORD` و `TIGERAPP_JWT_SECRET` مقدارهای تصادفی و طولانی قرار دهید.
3. سرویس‌ها را با `docker compose up -d --build` اجرا کنید.
4. آدرس `/install` را باز کنید و مراحل راه‌اندازی را انجام دهید.
5. پس از نصب موفق، رکورد نصب در دیتابیس و فایل `App_Data/installed.lock` ایجاد می‌شوند؛ از آن لحظه صفحه و API نصب مجدد در دسترس نخواهند بود.

رمز PostgreSQL در فرم نصب دریافت نمی‌شود و باید فقط در Secret Store یا متغیر محیطی سرور نگهداری شود.
در اجرای مستقیم برنامه نیز نزدیک‌ترین فایل `.env` به مسیر اجرا خوانده می‌شود. متغیرهای واقعی سیستم همیشه اولویت دارند و توسط فایل بازنویسی نمی‌شوند.

## مایگریشن

مایگریشن اولیه در `src/TigerApp.Infrastructure/Persistence/Migrations` قرار دارد. برای ساخت مایگریشن‌های بعدی:

```powershell
dotnet tool restore
dotnet tool run dotnet-ef migrations add NameOfChange `
  --project src/TigerApp.Infrastructure/TigerApp.Infrastructure.csproj `
  --startup-project src/TigerApp.Api/TigerApp.Api.csproj `
  --context TigerAppDbContext `
  --output-dir Persistence/Migrations
```

در production مایگریشن را بدون بررسی روی دیتابیس موجود اجرا نکنید. ویزارد نصب فقط برای دیتابیس خالی است و اگر کاربری از قبل وجود داشته باشد، برای جلوگیری از تصاحب حساب نصب را متوقف می‌کند.

## داده SQLite قبلی

فایل SQLite قبلی حذف یا بازنویسی نمی‌شود، اما داده‌های آن خودکار به PostgreSQL منتقل نمی‌شوند. پیش از انتقال داده واقعی، از فایل SQLite نسخه پشتیبان بگیرید و عملیات import را جداگانه و روی نسخه آزمایشی PostgreSQL اعتبارسنجی کنید.
