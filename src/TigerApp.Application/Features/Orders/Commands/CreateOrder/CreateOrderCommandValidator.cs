using FluentValidation;
using TigerApp.Application.Common.Helpers;
using TigerApp.Domain.Enums;

namespace TigerApp.Application.Features.Orders.Commands.CreateOrder;

public sealed class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    private static readonly string[] AllowedTimeRanges =
    [
        "۰۹:۰۰ تا ۱۱:۰۰",
        "۱۱:۰۰ تا ۱۳:۰۰",
        "۱۴:۰۰ تا ۱۶:۰۰",
        "۱۶:۰۰ تا ۱۸:۰۰",
        "۱۸:۰۰ تا ۲۰:۰۰"
    ];

    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("نوع سفارش معتبر نیست");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("یادداشت سفارش حداکثر می‌تواند ۱۰۰۰ کاراکتر باشد")
            .When(x => !string.IsNullOrWhiteSpace(x.Notes));

        When(x => x.Type == OrderType.Consultation, () =>
        {
            RuleFor(x => x.PreferredDateShamsi)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("تاریخ ترجیحی مشاوره را انتخاب کنید")
                .Must(BeAValidConsultationDate)
                .WithMessage("تاریخ مشاوره باید معتبر، از امروز به بعد و حداکثر تا دو سال آینده باشد");

            RuleFor(x => x.PreferredTimeRange)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("بازه زمانی ترجیحی را انتخاب کنید")
                .Must(value => value is not null && AllowedTimeRanges.Contains(value))
                .WithMessage("بازه زمانی انتخاب‌شده معتبر نیست");
        });

        When(x => x.Type == OrderType.Plan, () =>
        {
            RuleFor(x => x.PreferredDateShamsi)
                .Empty().WithMessage("برای سفارش طرح نباید تاریخ مشاوره ارسال شود");
            RuleFor(x => x.PreferredTimeRange)
                .Empty().WithMessage("برای سفارش طرح نباید ساعت مشاوره ارسال شود");
        });
    }

    private static bool BeAValidConsultationDate(string? value)
    {
        if (!value.TryToGregorian(out var date))
            return false;

        var today = PersianDateHelper.TodayInIran();
        return date >= today && date <= today.AddYears(2);
    }
}
