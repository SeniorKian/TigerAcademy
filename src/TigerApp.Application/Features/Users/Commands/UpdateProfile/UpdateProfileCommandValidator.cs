using System.Globalization;
using FluentValidation;
using TigerApp.Application.Common.Helpers;

namespace TigerApp.Application.Features.Users.Commands.UpdateProfile;

public sealed class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    private static readonly PersianCalendar PersianCalendar = new();

    public UpdateProfileCommandValidator()
    {
        RuleFor(x => x.FullName)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("نام و نام خانوادگی را وارد کنید")
            .Must(HaveFirstAndLastName).WithMessage("نام و نام خانوادگی را کامل وارد کنید")
            .Must(HaveValidNameLengths).WithMessage("نام یا نام خانوادگی بیش از حد طولانی است")
            .When(x => x.FullName is not null);

        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .MaximumLength(256).WithMessage("ایمیل حداکثر می‌تواند ۲۵۶ کاراکتر باشد")
            .EmailAddress().WithMessage("فرمت ایمیل معتبر نیست")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.Province)
            .MaximumLength(100).WithMessage("نام استان بیش از حد طولانی است")
            .When(x => !string.IsNullOrWhiteSpace(x.Province));

        RuleFor(x => x.City)
            .MaximumLength(100).WithMessage("نام شهر بیش از حد طولانی است")
            .When(x => !string.IsNullOrWhiteSpace(x.City));

        RuleFor(x => x.Quota)
            .MaximumLength(100).WithMessage("عنوان سهمیه بیش از حد طولانی است")
            .When(x => !string.IsNullOrWhiteSpace(x.Quota));

        RuleFor(x => x.FieldOfStudy)
            .MaximumLength(200).WithMessage("عنوان رشته تحصیلی بیش از حد طولانی است")
            .When(x => !string.IsNullOrWhiteSpace(x.FieldOfStudy));

        RuleFor(x => x.TelegramId)
            .Cascade(CascadeMode.Stop)
            .MaximumLength(100).WithMessage("آیدی تلگرام بیش از حد طولانی است")
            .Matches("^@?[A-Za-z0-9_]{5,32}$")
            .WithMessage("آیدی تلگرام باید ۵ تا ۳۲ کاراکتر انگلیسی، عدد یا زیرخط باشد")
            .When(x => !string.IsNullOrWhiteSpace(x.TelegramId));

        RuleFor(x => x.BirthDateShamsi)
            .Must(BeAValidBirthDate).WithMessage("تاریخ تولد شمسی معتبر نیست یا در آینده قرار دارد")
            .When(x => !string.IsNullOrWhiteSpace(x.BirthDateShamsi));

        RuleFor(x => x.BirthDate)
            .Must(date => !date.HasValue || (date.Value.Date >= new DateTime(1921, 3, 21) && date.Value.Date <= PersianDateHelper.TodayInIran()))
            .WithMessage("تاریخ تولد معتبر نیست یا در آینده قرار دارد");
    }

    private static string[] SplitName(string? value) => (value ?? string.Empty)
        .Trim()
        .Split(' ', 2, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    private static bool HaveFirstAndLastName(string? value) => SplitName(value).Length == 2;

    private static bool HaveValidNameLengths(string? value)
    {
        var parts = SplitName(value);
        return parts.Length == 2 && parts[0].Length <= 100 && parts[1].Length <= 100;
    }

    private static bool BeAValidBirthDate(string? value)
    {
        if (!value.TryToGregorian(out var date))
            return false;

        var minimum = PersianCalendar.ToDateTime(1300, 1, 1, 0, 0, 0, 0);
        return date >= minimum && date <= PersianDateHelper.TodayInIran();
    }
}
