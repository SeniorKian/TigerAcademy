using System.Security.Claims;
using TigerApp.Application.Common.Models;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TigerApp.Application.Features.Users.Commands.UpdateProfile;
using TigerApp.Application.Features.Users.DTOs;
using TigerApp.Domain.Interfaces;
using TigerApp.Domain.Enums;
using TigerApp.Application.Common.Helpers;

namespace TigerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IUnitOfWork _unitOfWork;

    public UsersController(IMediator mediator, IUnitOfWork unitOfWork)
    {
        _mediator = mediator;
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// دریافت پروفایل کاربر جاری
    /// </summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            return NotFound("کاربر یافت نشد");

        var dto = new UserProfileDto
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
            RoleName = RoleName(user.Role)
        };

        return Ok(dto);
    }

    /// <summary>
    /// بروزرسانی پروفایل
    /// </summary>
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.IsSuccess)
            return Ok(result);
        return BadRequest(result);
    }

    /// <summary>
    /// دریافت تمام کاربران (ادمین) با صفحه‌بندی و فیلتر
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Consultant")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] UserRole? role,
        [FromQuery] bool? isActive,
        [FromQuery] string? province,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 10, 100);
        var users = await _unitOfWork.Users.GetAllIncludingInactiveAsync(cancellationToken);
        var query = users.OrderByDescending(u => u.CreatedAt).AsEnumerable();
        if (role.HasValue) query = query.Where(u => u.Role == role.Value);
        if (isActive.HasValue) query = query.Where(u => u.IsActive == isActive.Value);
        if (!string.IsNullOrWhiteSpace(province)) query = query.Where(u => u.Province == province);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(u =>
                (u.FirstName?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
                || (u.LastName?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
                || $"{u.FirstName} {u.LastName}".Contains(term, StringComparison.OrdinalIgnoreCase)
                || (u.PhoneNumber?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
                || (u.Email?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var filtered = query.ToList();
        var items = filtered.Skip((page - 1) * pageSize).Take(pageSize).Select(u => new UserProfileDto
        {
            Id = u.Id,
            PhoneNumber = u.PhoneNumber ?? string.Empty,
            FullName = $"{u.FirstName} {u.LastName}".Trim(),
            Email = u.Email,
            Province = u.Province,
            City = u.City,
            Quota = u.Quota,
            FieldOfStudy = u.FieldOfStudy,
            BirthDate = u.Birthday,
            BirthDateShamsi = u.Birthday.HasValue ? u.Birthday.Value.ToPersianDate() : null,
            TelegramId = u.TelegramId,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt,
            CreatedAtShamsi = u.CreatedAt.ToPersianDateTime(),
            Role = u.Role.ToString(),
            RoleName = RoleName(u.Role)
        }).ToList();

        return Ok(new { items, page, pageSize, totalCount = filtered.Count, totalPages = (int)Math.Ceiling(filtered.Count / (double)pageSize) });
    }

    /// <summary>
    /// ویرایش پروفایل کاربر توسط ادمین (بدون تغییر شماره موبایل)
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AdminUpdate(int id, [FromBody] AdminUpdateUserRequest request, CancellationToken cancellationToken)
    {
        var user = (await _unitOfWork.Users.GetAllIncludingInactiveAsync(cancellationToken)).FirstOrDefault(x => x.Id == id);
        if (user == null) return NotFound(new { message = "کاربر یافت نشد" });

        if (request.FullName != null)
        {
            var nameParts = request.FullName.Trim().Split(' ', 2);
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
            catch (FormatException) { return BadRequest(new { message = "تاریخ تولد شمسی معتبر نیست" }); }
        }
        else if (request.ClearBirthDate) user.Birthday = null;
        if (request.TelegramId != null) user.TelegramId = string.IsNullOrWhiteSpace(request.TelegramId) ? null : request.TelegramId.Trim();

        user.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.Users.UpdateAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Ok(new UserProfileDto
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
            RoleName = RoleName(user.Role)
        });
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateUserStatusRequest request, CancellationToken cancellationToken)
    {
        var user = (await _unitOfWork.Users.GetAllIncludingInactiveAsync(cancellationToken)).FirstOrDefault(x => x.Id == id);
        if (user == null) return NotFound(new { message = "کاربر یافت نشد" });
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
        if (int.TryParse(currentUserId, out var adminId) && adminId == id && !request.IsActive)
            return BadRequest(new { message = "نمی‌توانید حساب فعال خودتان را غیرفعال کنید" });
        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.Users.UpdateAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new { user.Id, user.IsActive });
    }

    [HttpPut("{id:int}/role")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateUserRoleRequest request, CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(request.Role)) return BadRequest(new { message = "نقش انتخاب‌شده معتبر نیست" });
        var user = (await _unitOfWork.Users.GetAllIncludingInactiveAsync(cancellationToken)).FirstOrDefault(x => x.Id == id);
        if (user == null) return NotFound(new { message = "کاربر یافت نشد" });
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
        if (int.TryParse(currentUserId, out var adminId) && adminId == id && request.Role != UserRole.Admin)
            return BadRequest(new { message = "نمی‌توانید نقش مدیریت حساب خودتان را تغییر دهید" });
        user.Role = request.Role;
        user.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.Users.UpdateAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new { user.Id, Role = user.Role.ToString(), RoleName = RoleName(user.Role) });
    }

    [HttpGet("roles")]
    [Authorize(Roles = "Admin")]
    public IActionResult GetRoles() => Ok(Enum.GetValues<UserRole>().Select(role => new
    {
        Value = (int)role,
        Key = role.ToString(),
        Name = RoleName(role),
        Description = role switch
        {
            UserRole.Admin => "دسترسی کامل به همه بخش‌ها و تنظیمات",
            UserRole.Consultant => "مدیریت مشاوره‌ها، سفارش‌ها و مشاهده کاربران",
            UserRole.ContentManager => "مدیریت طرح‌ها، محتوا، سوالات و منوی سایت",
            _ => "دسترسی به پروفایل، خرید و پیگیری سفارش‌های شخصی"
        }
    }));

    private static string RoleName(UserRole role) => role switch
    {
        UserRole.Admin => "مدیر کل",
        UserRole.Consultant => "مشاور",
        UserRole.ContentManager => "مدیر محتوا",
        _ => "کاربر"
    };
}

public sealed class UpdateUserStatusRequest
{
    public bool IsActive { get; set; }
}

public sealed class UpdateUserRoleRequest
{
    public UserRole Role { get; set; }
}

public sealed class AdminUpdateUserRequest
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Province { get; set; }
    public string? City { get; set; }
    public string? Quota { get; set; }
    public string? FieldOfStudy { get; set; }
    public string? BirthDateShamsi { get; set; }
    public bool ClearBirthDate { get; set; }
    public string? TelegramId { get; set; }
}
