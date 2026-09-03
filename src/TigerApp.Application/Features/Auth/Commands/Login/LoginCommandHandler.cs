using MediatR;
using TigerApp.Application.Common.Models;
using TigerApp.Application.Features.Auth.DTOs;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Interfaces;
using RefreshToken = TigerApp.Domain.Entities.RefreshToken;

namespace TigerApp.Application.Features.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IUnitOfWork _unitOfWork;
    
    public LoginCommandHandler(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _unitOfWork = unitOfWork;
    }
    
    public async Task<Result<AuthResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByPhoneNumberAsync(request.PhoneNumber, cancellationToken);
        
        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Result<AuthResponse>.Failure("شماره موبایل یا رمز عبور نادرست است.");
        }
        
        if (!user.IsActive)
        {
            return Result<AuthResponse>.Failure("حساب کاربری شما غیرفعال است.");
        }
        
        // Generate tokens
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        var refreshTokenExpiration = DateTime.UtcNow.AddDays(7);
        
        // Save refresh token
        var refreshTokenEntity = new RefreshToken
        {
            Token = refreshToken,
            ExpiresAt = refreshTokenExpiration,
            UserId = user.Id,
            CreatedByIp = "127.0.0.1"
        };
        
        await _unitOfWork.RefreshTokens.AddAsync(refreshTokenEntity, cancellationToken);
        
        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        await _unitOfWork.Users.UpdateAsync(user, cancellationToken);
        
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        
        var response = new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            AccessTokenExpiration = _tokenService.GetTokenExpiration(accessToken),
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
        
        return Result<AuthResponse>.Success(response, "ورود موفقیت‌آمیز بود.");
    }
}
