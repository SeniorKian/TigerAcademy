using FluentValidation;

namespace TigerApp.Application.Features.Plans.Commands.CreatePlan;

public class CreatePlanCommandValidator : AbstractValidator<CreatePlanCommand>
{
    public CreatePlanCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("نام طرح الزامی است")
            .MaximumLength(200).WithMessage("نام طرح نباید بیشتر از ۲۰۰ کاراکتر باشد");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("توضیحات طرح الزامی است")
            .MaximumLength(2000).WithMessage("توضیحات نباید بیشتر از ۲۰۰۰ کاراکتر باشد");

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("قیمت نمی‌تواند منفی باشد");

        RuleFor(x => x.Order)
            .GreaterThanOrEqualTo(0).WithMessage("ترتیب نمی‌تواند منفی باشد");
    }
}
