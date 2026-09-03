using MediatR;
using TigerApp.Application.Common.Models;
using TigerApp.Application.Features.Auth.DTOs;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Enums;
using TigerApp.Domain.Interfaces;
using RefreshToken = TigerApp.Domain.Entities.RefreshToken;

namespace TigerApp.Application.Features.Auth.Commands.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<AuthResponse>>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IUnitOfWork _unitOfWork;
    
    public RegisterCommandHandler(
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
    
    public async Task<Result<AuthResponse>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        // Check if phone number exists
        if (await _userRepository.PhoneNumberExistsAsync(request.PhoneNumber, cancellationToken))
        {
            return Result<AuthResponse>.Failure("شماره موبایل قبلاً ثبت شده است.");
        }
        
        // Create user
        var user = new User
        {
            PhoneNumber = request.PhoneNumber,
            Email = request.Email,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Role = UserRole.User
        };
        
        await _unitOfWork.Users.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        
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
                Role = user.Role.ToString()
            }
        };
        
        return Result<AuthResponse>.Success(response, "ثبت‌نام موفقیت‌آمیز بود.");
    }
}
