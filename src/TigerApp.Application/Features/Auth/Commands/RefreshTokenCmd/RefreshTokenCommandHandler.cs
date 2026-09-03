using MediatR;
using TigerApp.Application.Common.Models;
using TigerApp.Application.Features.Auth.DTOs;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Interfaces;
using RefreshToken = TigerApp.Domain.Entities.RefreshToken;

namespace TigerApp.Application.Features.Auth.Commands.RefreshTokenCmd;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthResponse>>
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;
    private readonly IUnitOfWork _unitOfWork;
    
    public RefreshTokenCommandHandler(
        IUserRepository userRepository,
        ITokenService tokenService,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _unitOfWork = unitOfWork;
    }
    
    public async Task<Result<AuthResponse>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByRefreshTokenAsync(request.RefreshToken, cancellationToken);
        
        if (user == null)
        {
            return Result<AuthResponse>.Failure("رفرش توکن نادرست است.");
        }
        
        var refreshToken = user.RefreshTokens.FirstOrDefault(rt => rt.Token == request.RefreshToken);
        
        if (refreshToken == null || !refreshToken.IsValid)
        {
            return Result<AuthResponse>.Failure("رفرش توکن نامعتبر یا منقضی شده است.");
        }
        
        // Revoke current refresh token
        refreshToken.IsRevoked = true;
        refreshToken.ReplacedByToken = "rotated";
        
        // Generate new tokens
        var newAccessToken = _tokenService.GenerateAccessToken(user);
        var newRefreshToken = _tokenService.GenerateRefreshToken();
        var refreshTokenExpiration = DateTime.UtcNow.AddDays(7);
        
        // Save new refresh token
        var newRefreshTokenEntity = new RefreshToken
        {
            Token = newRefreshToken,
            ExpiresAt = refreshTokenExpiration,
            UserId = user.Id,
            CreatedByIp = "127.0.0.1"
        };
        
        await _unitOfWork.RefreshTokens.AddAsync(newRefreshTokenEntity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        
        var response = new AuthResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            AccessTokenExpiration = _tokenService.GetTokenExpiration(newAccessToken),
            User = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Province = user.Province,
                City = user.City,
                Role = user.Role.ToString()
            }
        };
        
        return Result<AuthResponse>.Success(response, "توکن با موفقیت تمدید شد.");
    }
}
