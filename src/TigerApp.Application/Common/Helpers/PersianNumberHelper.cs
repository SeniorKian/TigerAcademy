namespace TigerApp.Application.Common.Helpers;

public static class PersianNumberHelper
{
    private static readonly string[] PersianDigits = 
        { "۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹" };
    
    private static readonly string[] EnglishDigits = 
        { "0", "1", "2", "3", "4", "5", "6", "7", "8", "9" };
    
    public static string ToPersianDigits(this string input)
    {
        for (int i = 0; i < 10; i++)
            input = input.Replace(EnglishDigits[i], PersianDigits[i]);
        return input;
    }
    
    public static string ToEnglishDigits(this string input)
    {
        for (int i = 0; i < 10; i++)
            input = input.Replace(PersianDigits[i], EnglishDigits[i]);
        return input;
    }
    
    public static string ToPersianCurrency(this decimal amount)
    {
        return $"{amount:N0}".ToPersianDigits() + " تومان";
    }
    
    public static string ToPersianCurrencyWithRial(this decimal amount)
    {
        return $"{amount:N0}".ToPersianDigits() + " ریال";
    }
    
    public static string ToPersianNumber(this int number)
    {
        return number.ToString().ToPersianDigits();
    }
    
    public static string ToPersianNumber(this long number)
    {
        return number.ToString().ToPersianDigits();
    }
    
    public static string ToPersianPercentage(this decimal value)
    {
        return $"{value:N1}".ToPersianDigits() + "٪";
    }
}
