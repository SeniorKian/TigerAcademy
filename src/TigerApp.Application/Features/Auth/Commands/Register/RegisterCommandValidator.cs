using FluentValidation;

namespace TigerApp.Application.Features.Auth.Commands.Register;

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("شماره موبایل الزامی است")
            .Matches(@"^09\d{9}$").WithMessage("شماره موبایل نادرست است");
        
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("رمز عبور الزامی است")
            .MinimumLength(6).WithMessage("رمز عبور حداقل ۶ کاراکتر باشد");
        
        RuleFor(x => x.ConfirmPassword)
            .NotEmpty().WithMessage("تکرار رمز عبور الزامی است")
            .Equal(x => x.Password).WithMessage("رمز عبور و تکرار آن مطابقت ندارند");
        
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("نام الزامی است")
            .MaximumLength(100).WithMessage("نام نباید بیشتر از ۱۰۰ کاراکتر باشد");
        
        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("نام خانوادگی الزامی است")
            .MaximumLength(100).WithMessage("نام خانوادگی نباید بیشتر از ۱۰۰ کاراکتر باشد");
        
        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("فرمت ایمیل نادرست است")
            .When(x => !string.IsNullOrEmpty(x.Email));
    }
}
