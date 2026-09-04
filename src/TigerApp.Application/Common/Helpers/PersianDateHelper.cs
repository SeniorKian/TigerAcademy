using System.Globalization;

namespace TigerApp.Application.Common.Helpers;

public static class PersianDateHelper
{
    private static readonly PersianCalendar Pc = new();
    private static readonly TimeZoneInfo IranTimeZone = ResolveIranTimeZone();

    private static TimeZoneInfo ResolveIranTimeZone()
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById("Iran Standard Time"); }
        catch { return TimeZoneInfo.FindSystemTimeZoneById("Asia/Tehran"); }
    }

    private static DateTime InIran(this DateTime date) => date.Kind == DateTimeKind.Utc
        ? TimeZoneInfo.ConvertTimeFromUtc(date, IranTimeZone)
        : date;

    public static DateTime TodayInIran() => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, IranTimeZone).Date;
    
    public static string ToPersianDate(this DateTime date)
    {
        var local = date.InIran();
        return $"{Pc.GetYear(local):0000}/{Pc.GetMonth(local):00}/{Pc.GetDayOfMonth(local):00}".ToPersianDigits();
    }
    
    public static string ToPersianDateTime(this DateTime date)
    {
        var local = date.InIran();
        return $"{local.ToPersianDate()}، {local:HH:mm}".ToPersianDigits();
    }
    
    public static string ToPersianDayName(this DateTime date)
    {
        return Pc.GetDayOfWeek(date) switch
        {
            DayOfWeek.Saturday => "شنبه",
            DayOfWeek.Sunday => "یکشنبه",
            DayOfWeek.Monday => "دوشنبه",
            DayOfWeek.Tuesday => "سه‌شنبه",
            DayOfWeek.Wednesday => "چهارشنبه",
            DayOfWeek.Thursday => "پنجشنبه",
            DayOfWeek.Friday => "جمعه",
            _ => ""
        };
    }
    
    public static string ToPersianMonthName(this DateTime date)
    {
        return Pc.GetMonth(date) switch
        {
            1 => "فروردین",
            2 => "اردیبهشت",
            3 => "خرداد",
            4 => "تیر",
            5 => "مرداد",
            6 => "شهریور",
            7 => "مهر",
            8 => "آبان",
            9 => "آذر",
            10 => "دی",
            11 => "بهمن",
            12 => "اسفند",
            _ => ""
        };
    }
    
    public static DateTime ToGregorian(this string persianDate)
    {
        var parts = persianDate.ToEnglishDigits().Split('/');
        if (parts.Length != 3)
            throw new FormatException("فرمت تاریخ نادرست است. فرمت صحیح: YYYY/MM/DD");
        
        var year = int.Parse(parts[0]);
        var month = int.Parse(parts[1]);
        var day = int.Parse(parts[2]);
        
        return Pc.ToDateTime(year, month, day, 0, 0, 0, 0);
    }

    public static bool TryToGregorian(this string? persianDate, out DateTime date)
    {
        date = default;
        if (string.IsNullOrWhiteSpace(persianDate))
            return false;

        try
        {
            date = persianDate.ToGregorian().Date;
            return true;
        }
        catch (Exception exception) when (exception is FormatException
            or OverflowException
            or ArgumentOutOfRangeException)
        {
            return false;
        }
    }
}
