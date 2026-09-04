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

        var lookupValidation = await ValidateLookupsAsync(request, cancellationToken);
        if (lookupValidation is not null)
            return Result<UserProfileDto>.Failure(lookupValidation);

        var normalizedEmail = string.IsNullOrWhiteSpace(request.Email)
            ? null
            : request.Email.Trim().ToLowerInvariant();
        if (normalizedEmail is not null)
        {
            var duplicateEmail = await _unitOfWork.Users.AnyAsync(
                candidate => candidate.Id != user.Id
                    && candidate.Email != null
                    && candidate.Email.ToLower() == normalizedEmail,
                cancellationToken);
            if (duplicateEmail)
                return Result<UserProfileDto>.Failure("این ایمیل قبلاً برای حساب دیگری ثبت شده است");
        }

        // Update profile fields
        if (request.FullName != null)
        {
            var nameParts = request.FullName.Trim().Split(
                ' ', 2, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            user.FirstName = nameParts[0];
            user.LastName = nameParts.Length > 1 ? nameParts[1] : string.Empty;
        }
        if (request.Email != null) user.Email = normalizedEmail;
        if (request.Province != null) user.Province = string.IsNullOrWhiteSpace(request.Province) ? null : request.Province.Trim();
        if (request.City != null) user.City = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim();
        if (request.Quota != null) user.Quota = string.IsNullOrWhiteSpace(request.Quota) ? null : request.Quota.Trim();
        if (request.FieldOfStudy != null) user.FieldOfStudy = string.IsNullOrWhiteSpace(request.FieldOfStudy) ? null : request.FieldOfStudy.Trim();
        if (!string.IsNullOrWhiteSpace(request.BirthDateShamsi))
        {
            if (!request.BirthDateShamsi.TryToGregorian(out var birthDate))
                return Result<UserProfileDto>.Failure("تاریخ تولد شمسی معتبر نیست");
            user.Birthday = birthDate.Date;
        }
        else if (request.BirthDate.HasValue) user.Birthday = request.BirthDate.Value.Date;
        else if (request.ClearBirthDate) user.Birthday = null;
        if (request.TelegramId != null) user.TelegramId = string.IsNullOrWhiteSpace(request.TelegramId) ? null : request.TelegramId.Trim();
        
        user.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Users.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<UserProfileDto>.Success(MapToDto(user));
    }

    private async Task<string?> ValidateLookupsAsync(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var province = request.Province?.Trim();
        var city = request.City?.Trim();
        var quota = request.Quota?.Trim();
        var fieldOfStudy = request.FieldOfStudy?.Trim();

        if (string.IsNullOrWhiteSpace(province) && !string.IsNullOrWhiteSpace(city))
            return "برای انتخاب شهر، ابتدا استان را مشخص کنید";

        if (!string.IsNullOrWhiteSpace(province))
        {
            var provinces = await _unitOfWork.Provinces.FindAsync(
                item => item.IsActive && item.Name == province, cancellationToken);
            var selectedProvince = provinces.FirstOrDefault();
            if (selectedProvince is null)
                return "استان انتخاب‌شده معتبر نیست";

            if (!string.IsNullOrWhiteSpace(city))
            {
                var matchingCity = await _unitOfWork.Cities.AnyAsync(
                    item => item.IsActive && item.Name == city && item.ProvinceId == selectedProvince.Id,
                    cancellationToken);
                if (!matchingCity)
                    return "شهر انتخاب‌شده با استان مطابقت ندارد";
            }
        }

        if (!string.IsNullOrWhiteSpace(quota)
            && !await _unitOfWork.Quotas.AnyAsync(item => item.IsActive && item.Name == quota, cancellationToken))
            return "سهمیه انتخاب‌شده معتبر نیست";

        if (!string.IsNullOrWhiteSpace(fieldOfStudy)
            && !await _unitOfWork.FieldsOfStudy.AnyAsync(item => item.IsActive && item.Name == fieldOfStudy, cancellationToken))
            return "رشته تحصیلی انتخاب‌شده معتبر نیست";

        return null;
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
