using MediatR;
using TigerApp.Application.Common.Models;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Application.Features.Auth.Commands.Logout;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    
    public LogoutCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }
    
    public async Task<Result> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var refreshToken = await _unitOfWork.RefreshTokens
            .FindAsync(rt => rt.Token == request.RefreshToken, cancellationToken);
        
        var token = refreshToken.FirstOrDefault();
        
        if (token != null)
        {
            token.IsRevoked = true;
            await _unitOfWork.RefreshTokens.UpdateAsync(token, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        
        return Result.Success("خروج موفقیت‌آمیز بود.");
    }
}
