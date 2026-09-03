using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Common.Helpers;
using TigerApp.Application.Features.Users.DTOs;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Application.Features.Users.Commands.UpdateProfile;

public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, Result<UserProfileDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public UpdateProfileCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<UserProfileDto>> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null)
            return Result<UserProfileDto>.Failure("کاربر یافت نشد");

        var user = await _unitOfWork.Users.GetByIdAsync(userId.Value);
        if (user == null)
            return Result<UserProfileDto>.Failure("کاربر یافت نشد");

        // Update profile fields
        if (request.FullName != null)
        {
            var nameParts = request.FullName.Split(' ', 2);
            user.FirstName = nameParts[0];
            user.LastName = nameParts.Length > 1 ? nameParts[1] : string.Empty;
        }
        if (request.Email != null) user.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
        if (request.Province != null) user.Province = string.IsNullOrWhiteSpace(request.Province) ? null : request.Province.Trim();
        if (request.City != null) user.City = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim();
        if (request.Quota != null) user.Quota = string.IsNullOrWhiteSpace(request.Quota) ? null : request.Quota.Trim();
        if (request.FieldOfStudy != null) user.FieldOfStudy = string.IsNullOrWhiteSpace(request.FieldOfStudy) ? null : request.FieldOfStudy.Trim();
        if (!string.IsNullOrWhiteSpace(request.BirthDateShamsi))
        {
            try { user.Birthday = request.BirthDateShamsi.ToGregorian(); }
            catch (FormatException) { return Result<UserProfileDto>.Failure("تاریخ تولد شمسی معتبر نیست"); }
        }
        else if (request.BirthDate.HasValue) user.Birthday = request.BirthDate.Value;
        else if (request.ClearBirthDate) user.Birthday = null;
        if (request.TelegramId != null) user.TelegramId = string.IsNullOrWhiteSpace(request.TelegramId) ? null : request.TelegramId.Trim();
        
        user.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Users.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<UserProfileDto>.Success(MapToDto(user));
    }

    private static UserProfileDto MapToDto(Domain.Entities.User user)
    {
        return new UserProfileDto
        {
            Id = user.Id,
            PhoneNumber = user.PhoneNumber ?? string.Empty,
            FullName = $"{user.FirstName} {user.LastName}".Trim(),
            Email = user.Email,
            Province = user.Province,
            City = user.City,
            Quota = user.Quota,
            FieldOfStudy = user.FieldOfStudy,
            BirthDate = user.Birthday,
            BirthDateShamsi = user.Birthday.HasValue ? user.Birthday.Value.ToPersianDate() : null,
            TelegramId = user.TelegramId,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            CreatedAtShamsi = user.CreatedAt.ToPersianDateTime(),
            Role = user.Role.ToString(),
            RoleName = user.Role switch
            {
                Domain.Enums.UserRole.Admin => "مدیر کل",
                Domain.Enums.UserRole.Consultant => "مشاور",
                Domain.Enums.UserRole.ContentManager => "مدیر محتوا",
                _ => "کاربر"
            }
        };
    }
}
