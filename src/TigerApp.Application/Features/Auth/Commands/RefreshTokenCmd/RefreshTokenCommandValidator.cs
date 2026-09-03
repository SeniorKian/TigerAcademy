using FluentValidation;

namespace TigerApp.Application.Features.Auth.Commands.RefreshTokenCmd;

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("رفرش توکن الزامی است");
    }
}
