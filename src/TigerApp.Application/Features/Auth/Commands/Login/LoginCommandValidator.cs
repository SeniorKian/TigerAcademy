using FluentValidation;

namespace TigerApp.Application.Features.Auth.Commands.Login;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("شماره موبایل الزامی است")
            .Matches(@"^09\d{9}$").WithMessage("شماره موبایل نادرست است");
        
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("رمز عبور الزامی است")
            .MinimumLength(6).WithMessage("رمز عبور حداقل ۶ کاراکتر باشد");
    }
}
