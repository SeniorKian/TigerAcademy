using TigerApp.Domain.Entities;
using TigerApp.Domain.Enums;
using TigerApp.Infrastructure.Persistence.Context;

namespace TigerApp.Infrastructure.Persistence;

public static class SeedData
{
    public static async Task SeedAsync(TigerAppDbContext context)
    {
        // Check if data already exists
        if (context.Provinces.Any())
            return;

        // Seed Provinces
        var provinces = new List<Province>
        {
            new() { Name = "تهران", CreatedAt = DateTime.UtcNow },
            new() { Name = "قم", CreatedAt = DateTime.UtcNow },
            new() { Name = "البرز", CreatedAt = DateTime.UtcNow },
            new() { Name = "اصفهان", CreatedAt = DateTime.UtcNow },
            new() { Name = "فارس", CreatedAt = DateTime.UtcNow },
            new() { Name = "خوزستان", CreatedAt = DateTime.UtcNow },
            new() { Name = "آذربایجان شرقی", CreatedAt = DateTime.UtcNow },
            new() { Name = "آذربایجان غربی", CreatedAt = DateTime.UtcNow },
            new() { Name = "مازندران", CreatedAt = DateTime.UtcNow },
            new() { Name = "گیلان", CreatedAt = DateTime.UtcNow },
            new() { Name = "سمنان", CreatedAt = DateTime.UtcNow },
            new() { Name = "یزد", CreatedAt = DateTime.UtcNow },
            new() { Name = "کرمان", CreatedAt = DateTime.UtcNow },
            new() { Name = "خراسان رضوی", CreatedAt = DateTime.UtcNow },
            new() { Name = "خراسان شمالی", CreatedAt = DateTime.UtcNow },
            new() { Name = "خراسان جنوبی", CreatedAt = DateTime.UtcNow },
            new() { Name = "ایلام", CreatedAt = DateTime.UtcNow },
            new() { Name = "کهگیلویه و بویراحمد", CreatedAt = DateTime.UtcNow },
            new() { Name = "بوشهر", CreatedAt = DateTime.UtcNow },
            new() { Name = "کردستان", CreatedAt = DateTime.UtcNow },
            new() { Name = "لرستان", CreatedAt = DateTime.UtcNow },
            new() { Name = "همدان", CreatedAt = DateTime.UtcNow },
            new() { Name = "زنجان", CreatedAt = DateTime.UtcNow },
            new() { Name = "گلستان", CreatedAt = DateTime.UtcNow },
            new() { Name = "چهارمحال و بختیاری", CreatedAt = DateTime.UtcNow },
            new() { Name = "سیستان و بلوچستان", CreatedAt = DateTime.UtcNow },
            new() { Name = "هرمزگان", CreatedAt = DateTime.UtcNow },
            new() { Name = "اردبیل", CreatedAt = DateTime.UtcNow },
        };
        await context.Provinces.AddRangeAsync(provinces);
        await context.SaveChangesAsync();

        // Get province IDs
        var tehran = context.Provinces.First(p => p.Name == "تهران");
        var qom = context.Provinces.First(p => p.Name == "قم");
        var alborz = context.Provinces.First(p => p.Name == "البرز");
        var isfahan = context.Provinces.First(p => p.Name == "اصفهان");

        // Seed Cities
        var cities = new List<City>
        {
            new() { Name = "تهران", ProvinceId = tehran.Id, CreatedAt = DateTime.UtcNow },
            new() { Name = "ری", ProvinceId = tehran.Id, CreatedAt = DateTime.UtcNow },
            new() { Name = "شمیرانات", ProvinceId = tehran.Id, CreatedAt = DateTime.UtcNow },
            new() { Name = "اسلامشهر", ProvinceId = tehran.Id, CreatedAt = DateTime.UtcNow },
            new() { Name = "قم", ProvinceId = qom.Id, CreatedAt = DateTime.UtcNow },
            new() { Name = "کرج", ProvinceId = alborz.Id, CreatedAt = DateTime.UtcNow },
            new() { Name = "هشتگرد", ProvinceId = alborz.Id, CreatedAt = DateTime.UtcNow },
            new() { Name = "نظرآباد", ProvinceId = alborz.Id, CreatedAt = DateTime.UtcNow },
            new() { Name = "اصفهان", ProvinceId = isfahan.Id, CreatedAt = DateTime.UtcNow },
            new() { Name = "کاشان", ProvinceId = isfahan.Id, CreatedAt = DateTime.UtcNow },
        };
        await context.Cities.AddRangeAsync(cities);

        // Seed Fields of Study
        var fields = new List<FieldOfStudy>
        {
            new() { Name = "ریاضی فیزیک", Code = "R", CreatedAt = DateTime.UtcNow },
            new() { Name = "علوم تجربی", Code = "T", CreatedAt = DateTime.UtcNow },
            new() { Name = "علوم انسانی", Code = "H", CreatedAt = DateTime.UtcNow },
            new() { Name = "هنر", Code = "A", CreatedAt = DateTime.UtcNow },
            new() { Name = "زبان", Code = "L", CreatedAt = DateTime.UtcNow },
            new() { Name = "مکانیک", Code = "ME", CreatedAt = DateTime.UtcNow },
            new() { Name = "برق", Code = "EE", CreatedAt = DateTime.UtcNow },
            new() { Name = "کامپیوتر", Code = "CE", CreatedAt = DateTime.UtcNow },
            new() { Name = "عمران", Code = "CV", CreatedAt = DateTime.UtcNow },
            new() { Name = "پزشکی", Code = "MD", CreatedAt = DateTime.UtcNow },
            new() { Name = "داروسازی", Code = "PH", CreatedAt = DateTime.UtcNow },
            new() { Name = "دندانپزشکی", Code = "DS", CreatedAt = DateTime.UtcNow },
        };
        await context.FieldsOfStudy.AddRangeAsync(fields);

        // Seed Quotas
        var quotas = new List<Quota>
        {
            new() { Name = "عادی", CreatedAt = DateTime.UtcNow },
            new() { Name = "سهمیه ۲۵ درصدی", CreatedAt = DateTime.UtcNow },
            new() { Name = "سهمیه ۵ درصدی", CreatedAt = DateTime.UtcNow },
            new() { Name = "ایثارگران", CreatedAt = DateTime.UtcNow },
            new() { Name = "رزمندگان", CreatedAt = DateTime.UtcNow },
            new() { Name = "جانبازان", CreatedAt = DateTime.UtcNow },
        };
        await context.Quotas.AddRangeAsync(quotas);

        // Seed Default Menu Items
        var menuItems = new List<MenuItem>
        {
            new() { Title = "خانه", Link = "/", Icon = "home", Order = 1, CreatedAt = DateTime.UtcNow },
            new() { Title = "طرح‌ها", Link = "/plans", Icon = "package", Order = 2, CreatedAt = DateTime.UtcNow },
            new() { Title = "مشاوره", Link = "/consultations", Icon = "phone", Order = 3, CreatedAt = DateTime.UtcNow },
            new() { Title = "سوالات متداول", Link = "/faq", Icon = "help-circle", Order = 4, CreatedAt = DateTime.UtcNow },
            new() { Title = "تماس با ما", Link = "/contact", Icon = "phone-call", Order = 5, CreatedAt = DateTime.UtcNow },
        };
        await context.MenuItems.AddRangeAsync(menuItems);

        // Seed Sample Plans
        var samplePlans = new List<Plan>
        {
            new()
            {
                Name = "طرح پایه",
                Description = "شامل مشاوره تلفنی پایه و برنامه‌ریزی مطالعه",
                Price = 500000,
                Order = 1,
                Features = System.Text.Json.JsonSerializer.Serialize(new[] { "مشاوره تلفنی ۳۰ دقیقه", "برنامه‌ریزی مطالعه", "پشتیبانی تلگرامی" }),
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Name = "طرح ویژه",
                Description = "شامل مشاوره تلفنی و حضوری با برنامه‌ریزی دقیق",
                Price = 1500000,
                Order = 2,
                Features = System.Text.Json.JsonSerializer.Serialize(new[] { "مشاوره تلفنی ۶۰ دقیقه", "مشاوره حضوری ۱ جلسه", "برنامه‌ریزی هفتگی", "پشتیبانی ۲۴ ساعته" }),
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Name = "گلدن تایگر",
                Description = "طرح ویژه منتورینگ موفقیت قطعی",
                Price = 5000000,
                Order = 3,
                Features = System.Text.Json.JsonSerializer.Serialize(new[] { "مشاوره نامحدود", "منتورینگ اختصاصی", "برنامه‌ریزی روزانه", "پشتیبانی ویژه", "تضمین موفقیت" }),
                CreatedAt = DateTime.UtcNow
            }
        };
        await context.Plans.AddRangeAsync(samplePlans);

        // Seed Sample Consultations
        var sampleConsultations = new List<Consultation>
        {
            new()
            {
                Name = "مشاوره تلفنی ۳۰ دقیقه",
                Type = ConsultationType.Phone,
                DurationMinutes = 30,
                Price = 200000,
                Description = "مشاوره تخصصی انتخاب رشته به صورت تلفنی",
                Order = 1,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Name = "مشاوره تلفنی ۶۰ دقیقه",
                Type = ConsultationType.Phone,
                DurationMinutes = 60,
                Price = 350000,
                Description = "مشاوره تخصصی انتخاب رشته به صورت تلفنی",
                Order = 2,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Name = "مشاوره حضوری کرج",
                Type = ConsultationType.InPerson,
                City = "کرج",
                Price = 500000,
                Description = "مشاوره حضوری تخصصی انتخاب رشته",
                Order = 3,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Name = "مشاوره حضوری تهران",
                Type = ConsultationType.InPerson,
                City = "تهران",
                Price = 600000,
                Description = "مشاوره حضوری تخصصی انتخاب رشته",
                Order = 4,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Name = "مشاوره حضوری قم",
                Type = ConsultationType.InPerson,
                City = "قم",
                Price = 400000,
                Description = "مشاوره حضوری تخصصی انتخاب رشته",
                Order = 5,
                CreatedAt = DateTime.UtcNow
            }
        };
        await context.Consultations.AddRangeAsync(sampleConsultations);

        // Seed Sample FAQs
        var sampleFaqs = new List<Faq>
        {
            new()
            {
                Question = "انتخاب رشته چیست؟",
                Answer = "انتخاب رشته فرآیندی است که داوطلبان کنکور پس از اعلام نتایج، رشته‌ها و دانشگاه‌های مورد نظر خود را اولویت‌بندی و انتخاب می‌کنند.",
                Category = "عمومی",
                Order = 1,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Question = "مشاوره انتخاب رشته چگونه انجام می‌شود؟",
                Answer = "مشاوره انتخاب رشته به صورت تلفنی و حضوری با متخصصین مجرب انجام می‌شود. در این جلسات، رتبه، سهمیه، علایق و شرایط شما بررسی می‌شود.",
                Category = "مشاوره",
                Order = 2,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Question = "هزینه مشاوره چقدر است؟",
                Answer = "هزینه مشاوره بسته به نوع و مدت زمان آن متفاوت است. مشاوره تلفنی ۳۰ دقیقه‌ای از ۲۰۰ هزار تومان و مشاوره حضوری از ۴۰۰ هزار تومان شروع می‌شود.",
                Category = "هزینه",
                Order = 3,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                Question = "آیا تضمین موفقیت وجود دارد؟",
                Answer = "طرح گلدن تایگر با منتورینگ اختصاصی و برنامه‌ریزی دقیق، تضمین موفقیت ارائه می‌دهد. برای اطلاعات بیشتر با ما تماس بگیرید.",
                Category = "طرح‌ها",
                Order = 4,
                CreatedAt = DateTime.UtcNow
            }
        };
        await context.Faqs.AddRangeAsync(sampleFaqs);

        await context.SaveChangesAsync();
    }
}
