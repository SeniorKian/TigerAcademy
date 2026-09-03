using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Enums;
using TigerApp.Infrastructure.Persistence.Context;

namespace TigerApp.Infrastructure.Persistence;

public static class DemoDataSeeder
{
    private const string MarkerKey = "demo.dataset.v1";

    public static async Task<DemoSeedResult> SeedAsync(TigerAppDbContext context, CancellationToken cancellationToken = default)
    {
        if (await context.Contents.AnyAsync(x => x.Key == MarkerKey && x.Page == "debug", cancellationToken))
            return await BuildResult(context, false, cancellationToken);

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);

        var now = DateTime.UtcNow;
        var random = new Random(1405);
        var firstNames = new[] { "آرین", "نرگس", "محمد", "سارا", "پارسا", "هستی", "امیرحسین", "نگین", "کیان", "مبینا", "علی", "زینب" };
        var lastNames = new[] { "احمدی", "محمدی", "رضایی", "کریمی", "مرادی", "حسینی", "قاسمی", "اکبری", "جعفری", "صادقی" };
        var provinces = new[] { "تهران", "قم", "البرز", "اصفهان", "فارس", "خراسان رضوی", "مازندران", "گیلان" };
        var cities = new[] { "تهران", "قم", "کرج", "اصفهان", "شیراز", "مشهد", "ساری", "رشت" };
        var fields = new[] { "علوم تجربی", "ریاضی فیزیک", "علوم انسانی", "هنر", "زبان", "کامپیوتر" };
        var quotas = new[] { "عادی", "منطقه ۱", "منطقه ۲", "منطقه ۳", "سهمیه ۵ درصدی" };
        var sharedPassword = BCrypt.Net.BCrypt.HashPassword("Demo@123");

        var users = Enumerable.Range(1, 60).Select(i => new User
        {
            PhoneNumber = $"0901000{i:D4}",
            PasswordHash = sharedPassword,
            FirstName = firstNames[(i - 1) % firstNames.Length],
            LastName = lastNames[(i * 3) % lastNames.Length],
            Email = $"demo.user.{i:D3}@example.test",
            PhoneNumber2 = i % 4 == 0 ? $"0919000{i:D4}" : null,
            Province = provinces[(i - 1) % provinces.Length],
            City = cities[(i - 1) % cities.Length],
            FieldOfStudy = fields[(i - 1) % fields.Length],
            Quota = quotas[(i - 1) % quotas.Length],
            Birthday = new DateTime(2003 + i % 5, 1 + i % 12, 1 + i % 27, 0, 0, 0, DateTimeKind.Utc),
            TelegramId = $"demo_student_{i:D3}",
            Role = i % 15 == 0 ? UserRole.ContentManager : i % 10 == 0 ? UserRole.Consultant : UserRole.User,
            LastLoginAt = now.AddDays(-i % 21),
            IsActive = i % 17 != 0
        }).ToList();
        await context.Users.AddRangeAsync(users, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        for (var i = 0; i < users.Count; i++) users[i].CreatedAt = now.AddDays(-(i * 3 + 1));
        await context.SaveChangesAsync(cancellationToken);

        var planNames = new[] { "استارت کنکور", "نقشه راه یک‌ماهه", "جمع‌بندی طلایی", "انتخاب رشته هوشمند", "منتورینگ نقره‌ای", "منتورینگ پلاتینیوم", "تحلیل کارنامه", "برنامه‌ریزی فشرده", "آزمون و تحلیل هفتگی", "همراه خانواده", "کمپ مطالعاتی", "پکیج رتبه‌برتر" };
        var plans = planNames.Select((name, i) => new Plan
        {
            Name = $"[دمو] {name}",
            Description = $"داده نمایشی برای بررسی کارت طرح، قیمت، امکانات و وضعیت فعال/غیرفعال — نمونه {i + 1}",
            Price = 350_000 + i * 425_000,
            Order = 20 + i,
            Features = JsonSerializer.Serialize(new[] { "جلسه ارزیابی اولیه", $"{2 + i % 5} جلسه مشاوره", "برنامه‌ریزی اختصاصی", i % 2 == 0 ? "پشتیبانی روزانه" : "گزارش هفتگی والدین" }),
            ImageUrl = i % 3 == 0 ? $"https://picsum.photos/seed/tiger-plan-{i}/900/600" : null,
            IsActive = i % 6 != 5
        }).ToList();
        await context.Plans.AddRangeAsync(plans, cancellationToken);

        var consultationNames = new[] { "تماس فوری ۲۰ دقیقه", "جلسه تلفنی ۴۵ دقیقه", "جلسه تلفنی ۹۰ دقیقه", "جلسه آنلاین عمومی", "جلسه آنلاین تحلیل کارنامه", "جلسه آنلاین والدین", "حضوری تهران", "حضوری قم", "حضوری کرج", "حضوری اصفهان", "حضوری شیراز", "مشاوره رشته تجربی", "مشاوره رشته ریاضی", "مشاوره رشته انسانی", "جلسه ویژه پشت‌کنکوری‌ها" };
        var consultations = consultationNames.Select((name, i) => new Consultation
        {
            Name = $"[دمو] {name}",
            Type = (ConsultationType)(i % 3),
            City = i % 3 == 1 ? cities[i % cities.Length] : null,
            DurationMinutes = i % 3 == 1 ? null : 20 + i * 5,
            Price = 180_000 + i * 70_000,
            Description = "سرویس نمایشی برای تست رزرو، نوع جلسه، مدت، شهر و قیمت.",
            Order = 20 + i,
            IsActive = i % 7 != 6
        }).ToList();
        await context.Consultations.AddRangeAsync(consultations, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        for (var i = 0; i < plans.Count; i++) plans[i].CreatedAt = now.AddDays(-10 - i * 4);
        for (var i = 0; i < consultations.Count; i++) consultations[i].CreatedAt = now.AddDays(-8 - i * 3);
        await context.SaveChangesAsync(cancellationToken);

        var categories = new[] { "ثبت‌نام", "پرداخت", "مشاوره", "طرح‌ها", "انتخاب رشته", "پشتیبانی" };
        var faqs = Enumerable.Range(1, 30).Select(i => new Faq
        {
            Question = $"پرسش نمایشی شماره {i}: چطور از بخش {categories[(i - 1) % categories.Length]} استفاده کنم؟",
            Answer = $"این پاسخ نمایشی شماره {i} برای بررسی باز و بسته‌شدن آکاردئون، متن‌های کوتاه و بلند و دسته‌بندی ساخته شده است. اطلاعات این رکورد واقعی نیست و فقط برای دیباگ رابط کاربری استفاده می‌شود.",
            Category = categories[(i - 1) % categories.Length],
            Order = 20 + i,
            IsActive = i % 11 != 0
        }).ToList();
        await context.Faqs.AddRangeAsync(faqs, cancellationToken);

        var contents = new List<Content>
        {
            new() { Key = "demo.about.title", Page = "about", Section = "hero", Type = ContentType.Text, Value = "درباره آکادمی تایگر — صفحه نمایشی", Order = 1 },
            new() { Key = "demo.about.html", Page = "about", Section = "body", Type = ContentType.Html, Value = "<h2>مسیر روشن برای انتخاب رشته</h2><p>این یک محتوای <strong>نمایشی</strong> برای تست ویرایشگر HTML و صفحه پویاست.</p><blockquote>تصمیم خوب از اطلاعات خوب شروع می‌شود.</blockquote>", Order = 2 },
            new() { Key = "demo.about.image", Page = "about", Section = "media", Type = ContentType.Image, Value = "https://picsum.photos/seed/tiger-about/1200/700", Order = 3 },
            new() { Key = "demo.rules.title", Page = "rules", Section = "hero", Type = ContentType.Text, Value = "قوانین و شرایط استفاده — نسخه نمایشی", Order = 1 },
            new() { Key = "demo.rules.html", Page = "rules", Section = "body", Type = ContentType.Html, Value = "<h2>قوانین آزمایشی</h2><ol><li>اطلاعات صحیح وارد کنید.</li><li>کد پیگیری را نگه دارید.</li><li>این متن فقط برای دیباگ است.</li></ol>", Order = 2 },
            new() { Key = "demo.privacy.title", Page = "privacy", Section = "hero", Type = ContentType.Text, Value = "حریم خصوصی — محتوای نمایشی", Order = 1 },
            new() { Key = "demo.privacy.html", Page = "privacy", Section = "body", Type = ContentType.Html, Value = "<h2>حفظ اطلاعات کاربران</h2><p>نمونه متن طولانی برای بررسی فاصله خطوط، لینک‌ها و نمایش موبایل.</p><p><a href=\"/\">بازگشت به خانه</a></p>", Order = 2 },
            new() { Key = "demo.media.video", Page = "media", Section = "video", Type = ContentType.Video, Value = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", Order = 1 },
            new() { Key = "demo.media.banner", Page = "media", Section = "banner", Type = ContentType.Banner, Value = "https://picsum.photos/seed/tiger-banner/1600/600", Order = 2 },
            new() { Key = "demo.media.slider", Page = "media", Section = "slider", Type = ContentType.Slider, Value = "https://picsum.photos/seed/tiger-slide-1/1200/650\nhttps://picsum.photos/seed/tiger-slide-2/1200/650\nhttps://picsum.photos/seed/tiger-slide-3/1200/650", Order = 3 },
            new() { Key = "payment.card.enabled", Page = "system", Section = "settings", Type = ContentType.Text, Value = "True", Order = 50 },
            new() { Key = "payment.card.number", Page = "system", Section = "settings", Type = ContentType.Text, Value = "0000-0000-0000-0000", Order = 51 },
            new() { Key = "payment.card.holder", Page = "system", Section = "settings", Type = ContentType.Text, Value = "حساب کاملاً آزمایشی — واریز نکنید", Order = 52 },
        };
        for (var i = 1; i <= 14; i++) contents.Add(new Content { Key = $"demo.home.block.{i:D2}", Page = "home", Section = i % 2 == 0 ? "features" : "highlights", Type = i % 5 == 0 ? ContentType.Html : ContentType.Text, Value = i % 5 == 0 ? $"<h3>بلوک نمایشی {i}</h3><p>متن قالب‌بندی‌شده برای تست صفحه اصلی.</p>" : $"متن نمایشی بلوک شماره {i} برای بررسی ترتیب، وضعیت و تراکم محتوا.", Order = 50 + i, IsActive = i % 9 != 0 });
        var requestedContentKeys = contents.Select(x => x.Key).ToList();
        var existingContentKeys = await context.Contents
            .Where(x => requestedContentKeys.Contains(x.Key))
            .Select(x => new { x.Key, x.Page, x.Language })
            .ToListAsync(cancellationToken);
        contents = contents.Where(item => !existingContentKeys.Any(existing => existing.Key == item.Key && existing.Page == item.Page && existing.Language == item.Language)).ToList();
        await context.Contents.AddRangeAsync(contents, cancellationToken);

        var academyMenu = new MenuItem { Title = "[دمو] آکادمی", Link = "/page/about", Icon = "book-open", Order = 20 };
        var resourcesMenu = new MenuItem { Title = "[دمو] رسانه", Link = "/page/media", Icon = "video", Order = 21 };
        await context.MenuItems.AddRangeAsync(new[] { academyMenu, resourcesMenu }, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        await context.MenuItems.AddRangeAsync(new[]
        {
            new MenuItem { Title = "درباره ما", Link = "/page/about", ParentId = academyMenu.Id, Order = 1 },
            new MenuItem { Title = "قوانین", Link = "/page/rules", ParentId = academyMenu.Id, Order = 2 },
            new MenuItem { Title = "حریم خصوصی", Link = "/page/privacy", ParentId = academyMenu.Id, Order = 3 },
            new MenuItem { Title = "ویدیو و تصاویر", Link = "/page/media", ParentId = resourcesMenu.Id, Order = 1 },
            new MenuItem { Title = "تماس آزمایشی", Link = "tel:00000000000", ParentId = resourcesMenu.Id, Order = 2 },
            new MenuItem { Title = "لینک خارجی نمونه", Link = "https://example.com", ParentId = resourcesMenu.Id, Order = 3 },
        }, cancellationToken);

        var allPlans = await context.Plans.Where(x => x.IsActive).ToListAsync(cancellationToken);
        var allConsultations = await context.Consultations.Where(x => x.IsActive).ToListAsync(cancellationToken);
        var statuses = Enum.GetValues<OrderStatus>();
        var orders = new List<Order>();
        for (var i = 1; i <= 140; i++)
        {
            var isPlan = i % 3 != 0;
            var plan = isPlan ? allPlans[i % allPlans.Count] : null;
            var consultation = isPlan ? null : allConsultations[i % allConsultations.Count];
            var status = statuses[(i - 1) % statuses.Length];
            orders.Add(new Order
            {
                UserId = users[(i * 7) % users.Count].Id,
                Type = isPlan ? OrderType.Plan : OrderType.Consultation,
                PlanId = plan?.Id,
                ConsultationId = consultation?.Id,
                Amount = plan?.Price ?? consultation!.Price,
                Status = status,
                TrackingCode = $"DEMO-1405-{i:D4}",
                PaymentGateway = status is OrderStatus.Paid or OrderStatus.Completed or OrderStatus.Refunded ? (i % 2 == 0 ? "Zarinpal" : "CardToCard") : null,
                PaymentReference = status is OrderStatus.Paid or OrderStatus.Completed or OrderStatus.Refunded ? $"DEMOREF{i:D8}" : null,
                Notes = $"سفارش نمایشی شماره {i} — وضعیت {status}",
                IsActive = true
            });
        }
        await context.Orders.AddRangeAsync(orders, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        for (var i = 0; i < orders.Count; i++)
        {
            var createdAt = now.AddDays(-random.Next(0, 185)).AddHours(-random.Next(0, 23));
            orders[i].CreatedAt = createdAt;
            if (orders[i].Status is OrderStatus.Paid or OrderStatus.Completed or OrderStatus.Refunded) orders[i].PaidAt = createdAt.AddMinutes(random.Next(2, 90));
        }
        await context.SaveChangesAsync(cancellationToken);

        var payableOrders = orders.Where(x => x.Status is OrderStatus.Paid or OrderStatus.Completed or OrderStatus.Refunded).ToList();
        var payments = payableOrders.Select((order, i) => new Payment
        {
            OrderId = order.Id,
            Amount = order.Amount,
            Status = order.Status == OrderStatus.Refunded ? PaymentStatus.Refunded : PaymentStatus.Successful,
            Gateway = order.PaymentGateway,
            ReferenceId = $"DEMOAUTH{i:D8}",
            BankReference = order.PaymentReference,
            CardNumber = $"6037******{1000 + i % 8999}",
            PaidAt = order.PaidAt,
            ResponseJson = "{\"demo\":true,\"message\":\"پرداخت آزمایشی\"}"
        }).ToList();
        await context.Payments.AddRangeAsync(payments, cancellationToken);
        await context.Contents.AddAsync(new Content { Key = MarkerKey, Page = "debug", Section = "dataset", Type = ContentType.Text, Value = "TigerAcademy demo dataset v1", Order = 999, IsActive = true }, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        for (var i = 0; i < payments.Count; i++) payments[i].CreatedAt = payableOrders[i].PaidAt ?? payableOrders[i].CreatedAt;
        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return await BuildResult(context, true, cancellationToken);
    }

    private static async Task<DemoSeedResult> BuildResult(TigerAppDbContext context, bool inserted, CancellationToken cancellationToken) => new(
        inserted,
        await context.Users.CountAsync(x => x.PhoneNumber.StartsWith("0901000"), cancellationToken),
        await context.Orders.CountAsync(x => x.TrackingCode != null && x.TrackingCode.StartsWith("DEMO-"), cancellationToken),
        await context.Plans.CountAsync(x => x.Name.StartsWith("[دمو]"), cancellationToken),
        await context.Consultations.CountAsync(x => x.Name.StartsWith("[دمو]"), cancellationToken),
        await context.Faqs.CountAsync(x => x.Question.StartsWith("پرسش نمایشی"), cancellationToken),
        await context.Contents.CountAsync(x => x.Key.StartsWith("demo."), cancellationToken),
        await context.MenuItems.CountAsync(x => x.Title.Contains("دمو") || x.ParentId != null, cancellationToken),
        "رمز همه کاربران نمایشی: Demo@123");
}

public sealed record DemoSeedResult(bool Inserted, int Users, int Orders, int Plans, int Consultations, int Faqs, int Contents, int MenuItems, string LoginHint);
