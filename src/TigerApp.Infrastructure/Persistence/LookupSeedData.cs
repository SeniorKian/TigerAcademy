using Microsoft.EntityFrameworkCore;
using TigerApp.Domain.Entities;
using TigerApp.Infrastructure.Persistence.Context;

namespace TigerApp.Infrastructure.Persistence;

public static class LookupSeedData
{
    private static readonly IReadOnlyDictionary<string, string[]> ProvinceCities = new Dictionary<string, string[]>
    {
        ["آذربایجان شرقی"] = ["تبریز", "مراغه", "مرند", "میانه", "اهر", "بناب", "سراب", "شبستر"],
        ["آذربایجان غربی"] = ["ارومیه", "خوی", "مهاباد", "میاندوآب", "بوکان", "سلماس", "نقده", "ماکو"],
        ["اردبیل"] = ["اردبیل", "پارس‌آباد", "مشگین‌شهر", "خلخال", "گرمی", "نمین"],
        ["اصفهان"] = ["اصفهان", "کاشان", "خمینی‌شهر", "نجف‌آباد", "شاهین‌شهر", "فلاورجان", "شهرضا", "گلپایگان", "نائین"],
        ["البرز"] = ["کرج", "فردیس", "نظرآباد", "هشتگرد", "محمدشهر", "اشتهارد"],
        ["ایلام"] = ["ایلام", "دهلران", "آبدانان", "ایوان", "مهران", "دره‌شهر"],
        ["بوشهر"] = ["بوشهر", "برازجان", "گناوه", "کنگان", "جم", "خورموج", "عسلویه"],
        ["تهران"] = ["تهران", "ری", "شمیرانات", "اسلامشهر", "شهریار", "قدس", "ملارد", "ورامین", "پاکدشت", "دماوند", "پردیس", "رباط‌کریم"],
        ["چهارمحال و بختیاری"] = ["شهرکرد", "بروجن", "فارسان", "لردگان", "اردل", "سامان"],
        ["خراسان جنوبی"] = ["بیرجند", "قائن", "فردوس", "طبس", "نهبندان", "سرایان"],
        ["خراسان رضوی"] = ["مشهد", "نیشابور", "سبزوار", "تربت حیدریه", "کاشمر", "قوچان", "تربت جام", "چناران", "گناباد"],
        ["خراسان شمالی"] = ["بجنورد", "شیروان", "اسفراین", "جاجرم", "آشخانه", "فاروج"],
        ["خوزستان"] = ["اهواز", "آبادان", "خرمشهر", "دزفول", "اندیمشک", "ماهشهر", "شوشتر", "بهبهان", "مسجدسلیمان", "ایذه"],
        ["زنجان"] = ["زنجان", "ابهر", "خرمدره", "قیدار", "طارم", "ماه‌نشان"],
        ["سمنان"] = ["سمنان", "شاهرود", "دامغان", "گرمسار", "مهدی‌شهر", "سرخه"],
        ["سیستان و بلوچستان"] = ["زاهدان", "زابل", "ایرانشهر", "چابهار", "خاش", "سراوان", "کنارک", "نیک‌شهر"],
        ["فارس"] = ["شیراز", "مرودشت", "جهرم", "فسا", "کازرون", "لار", "داراب", "آباده", "اقلید", "نی‌ریز"],
        ["قزوین"] = ["قزوین", "تاکستان", "آبیک", "الوند", "بوئین‌زهرا", "محمدیه"],
        ["قم"] = ["قم", "جعفریه", "کهک", "قنوات", "سلفچگان"],
        ["کردستان"] = ["سنندج", "سقز", "مریوان", "بانه", "قروه", "بیجار", "کامیاران"],
        ["کرمان"] = ["کرمان", "رفسنجان", "سیرجان", "جیرفت", "بم", "زرند", "کهنوج", "شهربابک"],
        ["کرمانشاه"] = ["کرمانشاه", "اسلام‌آباد غرب", "جوانرود", "کنگاور", "پاوه", "سنقر", "سرپل ذهاب", "هرسین"],
        ["کهگیلویه و بویراحمد"] = ["یاسوج", "دوگنبدان", "دهدشت", "لیکک", "سی‌سخت", "چرام"],
        ["گلستان"] = ["گرگان", "گنبدکاووس", "علی‌آباد کتول", "آق‌قلا", "کردکوی", "مینودشت", "بندر ترکمن"],
        ["گیلان"] = ["رشت", "بندر انزلی", "لاهیجان", "لنگرود", "آستارا", "تالش", "رودسر", "فومن", "صومعه‌سرا"],
        ["لرستان"] = ["خرم‌آباد", "بروجرد", "دورود", "کوهدشت", "الیگودرز", "ازنا", "نورآباد"],
        ["مازندران"] = ["ساری", "بابل", "آمل", "قائم‌شهر", "بهشهر", "نکا", "چالوس", "تنکابن", "رامسر", "نوشهر"],
        ["مرکزی"] = ["اراک", "ساوه", "خمین", "محلات", "دلیجان", "تفرش", "شازند"],
        ["هرمزگان"] = ["بندرعباس", "میناب", "قشم", "بندر لنگه", "کیش", "حاجی‌آباد", "جاسک", "رودان"],
        ["همدان"] = ["همدان", "ملایر", "نهاوند", "تویسرکان", "اسدآباد", "کبودرآهنگ", "بهار"],
        ["یزد"] = ["یزد", "میبد", "اردکان", "بافق", "مهریز", "ابرکوه", "تفت", "اشکذر"]
    };

    private static readonly (string Name, string Code)[] Fields =
    [
        ("ریاضی فیزیک", "R"), ("علوم تجربی", "T"), ("علوم انسانی", "H"), ("هنر", "A"), ("زبان‌های خارجی", "L"),
        ("فنی و حرفه‌ای", "TV"), ("کاردانش", "KD"), ("علوم پایه", "BS"), ("مهندسی کامپیوتر", "CE"), ("مهندسی برق", "EE"),
        ("مهندسی مکانیک", "ME"), ("مهندسی عمران", "CV"), ("مهندسی صنایع", "IE"), ("معماری", "AR"), ("پزشکی", "MD"),
        ("دندانپزشکی", "DS"), ("داروسازی", "PH"), ("پرستاری", "NU"), ("روانشناسی", "PS"), ("حقوق", "LW"),
        ("مدیریت", "MG"), ("حسابداری", "AC"), ("اقتصاد", "EC"), ("علوم تربیتی", "ED"), ("سایر", "OT")
    ];

    private static readonly string[] Quotas = ["عادی", "منطقه ۱", "منطقه ۲", "منطقه ۳", "سهمیه ۵ درصدی", "سهمیه ۲۵ درصدی", "ایثارگران", "رزمندگان", "خانواده شهدا", "مناطق محروم"];

    public static async Task EnsureCompleteAsync(TigerAppDbContext context, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var provinces = await context.Provinces.ToListAsync(cancellationToken);
        foreach (var provinceName in ProvinceCities.Keys)
        {
            if (provinces.Any(x => x.Name == provinceName)) continue;
            var province = new Province { Name = provinceName, Order = provinces.Count + 1, CreatedAt = now };
            provinces.Add(province);
            context.Provinces.Add(province);
        }
        await context.SaveChangesAsync(cancellationToken);

        var cities = await context.Cities.ToListAsync(cancellationToken);
        foreach (var (provinceName, cityNames) in ProvinceCities)
        {
            var province = provinces.First(x => x.Name == provinceName);
            var order = cities.Count(x => x.ProvinceId == province.Id);
            foreach (var cityName in cityNames)
            {
                if (cities.Any(x => x.ProvinceId == province.Id && x.Name == cityName)) continue;
                var city = new City { Name = cityName, ProvinceId = province.Id, Order = ++order, CreatedAt = now };
                cities.Add(city);
                context.Cities.Add(city);
            }
        }

        var existingFields = await context.FieldsOfStudy.ToListAsync(cancellationToken);
        foreach (var (name, code) in Fields)
        {
            if (existingFields.Any(x => x.Name == name)) continue;
            context.FieldsOfStudy.Add(new FieldOfStudy { Name = name, Code = code, Order = existingFields.Count + 1, CreatedAt = now });
            existingFields.Add(new FieldOfStudy { Name = name });
        }

        var existingQuotas = await context.Quotas.ToListAsync(cancellationToken);
        foreach (var name in Quotas)
        {
            if (existingQuotas.Any(x => x.Name == name)) continue;
            context.Quotas.Add(new Quota { Name = name, Order = existingQuotas.Count + 1, CreatedAt = now });
            existingQuotas.Add(new Quota { Name = name });
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
