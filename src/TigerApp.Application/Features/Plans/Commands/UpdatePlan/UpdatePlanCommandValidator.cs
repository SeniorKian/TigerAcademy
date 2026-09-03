using FluentValidation;

namespace TigerApp.Application.Features.Plans.Commands.UpdatePlan;

public class UpdatePlanCommandValidator : AbstractValidator<UpdatePlanCommand>
{
    public UpdatePlanCommandValidator()
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage("شناسه طرح نامعتبر است");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("نام طرح الزامی است")
            .MaximumLength(200).WithMessage("نام طرح نباید بیشتر از ۲۰۰ کاراکتر باشد");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("توضیحات طرح الزامی است");

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("قیمت نمی‌تواند منفی باشد");
    }
}
