using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MenuController : BaseApiController
{
    private readonly IUnitOfWork _unitOfWork;

    public MenuController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// دریافت منوی اصلی
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetMenu()
    {
        var menuItems = await _unitOfWork.MenuItems.GetAllAsync();
        var activeItems = menuItems
            .Where(m => m.IsActive && m.ParentId == null)
            .OrderBy(m => m.Order)
            .Select(m => new
            {
                m.Id,
                m.Title,
                m.Icon,
                m.Link,
                m.Order,
                Children = menuItems
                    .Where(c => c.ParentId == m.Id && c.IsActive)
                    .OrderBy(c => c.Order)
                    .Select(c => new
                    {
                        c.Id,
                        c.Title,
                        c.Icon,
                        c.Link,
                        c.Order
                    })
                    .ToList()
            })
            .ToList();

        return Ok(activeItems);
    }

    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> GetAllForAdmin(CancellationToken cancellationToken)
    {
        var items = await _unitOfWork.MenuItems.GetAllIncludingInactiveAsync(cancellationToken);
        return Ok(items.OrderBy(x => x.Order).Select(x => new { x.Id, x.Title, x.Icon, x.Link, x.Order, x.ParentId, x.IsActive }));
    }

    /// <summary>
    /// ایجاد آیتم منو (ادمین)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> Create([FromBody] CreateMenuItemRequest request)
    {
        var validation = await ValidateAndNormalizeAsync(request, null);
        if (validation != null) return BadRequest(validation);
        var menuItem = new Domain.Entities.MenuItem
        {
            Title = request.Title,
            Icon = request.Icon,
            Link = request.Link,
            Order = request.Order,
            ParentId = request.ParentId,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.MenuItems.AddAsync(menuItem);
        await _unitOfWork.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMenu), ToDto(menuItem));
    }

    /// <summary>
    /// ویرایش آیتم منو (ادمین)
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateMenuItemRequest request)
    {
        var menuItem = await _unitOfWork.MenuItems.GetByIdAsync(id);
        if (menuItem == null)
            return NotFound("آیتم منو یافت نشد");

        var validation = await ValidateAndNormalizeAsync(request, id);
        if (validation != null) return BadRequest(validation);

        menuItem.Title = request.Title;
        menuItem.Icon = request.Icon;
        menuItem.Link = request.Link;
        menuItem.Order = request.Order;
        menuItem.ParentId = request.ParentId;
        menuItem.IsActive = request.IsActive;
        menuItem.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.MenuItems.UpdateAsync(menuItem);
        await _unitOfWork.SaveChangesAsync();

        return Ok(ToDto(menuItem));
    }

    /// <summary>
    /// غیرفعال‌سازی قابل بازگشت آیتم منو
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> Delete(int id)
    {
        var menuItem = await _unitOfWork.MenuItems.GetByIdAsync(id);
        if (menuItem == null)
            return NotFound("آیتم منو یافت نشد");

        menuItem.IsActive = false;
        menuItem.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.MenuItems.UpdateAsync(menuItem);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { message = "آیتم منو با موفقیت غیرفعال شد" });
    }

    /// <summary>حذف دائمی فقط همین پیوند، بدون حذف محتوای مقصد یا زیرمنوها</summary>
    [HttpDelete("{id:int}/permanent")]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> DeletePermanently(int id, CancellationToken cancellationToken)
    {
        var item = await _unitOfWork.MenuItems.GetByIdAsync(id, cancellationToken);
        if (item == null) return NotFound("آیتم منو یافت نشد؛ ممکن است قبلاً حذف شده باشد.");

        const string childrenMessage = "این پیوند زیرمنو دارد (حتی اگر غیرفعال باشد). ابتدا زیرمنوها را جابه‌جا یا حذف کنید.";
        if (await _unitOfWork.MenuItems.AnyAsync(child => child.ParentId == id, cancellationToken))
            return Conflict(new { message = childrenMessage });

        await _unitOfWork.MenuItems.PermanentlyDeleteAsync(item, cancellationToken);
        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // The restrictive FK also protects a child created after the check above.
            if (await _unitOfWork.MenuItems.AnyAsync(child => child.ParentId == id, cancellationToken))
                return Conflict(new { message = childrenMessage });
            throw;
        }
        return Ok(new { message = "پیوند برای همیشه حذف شد؛ محتوای صفحه مقصد تغییری نکرد." });
    }

    private async Task<string?> ValidateAndNormalizeAsync(CreateMenuItemRequest request, int? currentId)
    {
        request.Title = request.Title?.Trim() ?? string.Empty;
        request.Icon = string.IsNullOrWhiteSpace(request.Icon) ? null : request.Icon.Trim();
        request.Link = NormalizeLink(request.Link?.Trim() ?? string.Empty);

        if (request.Title.Length is < 1 or > 100) return "عنوان باید بین ۱ تا ۱۰۰ کاراکتر باشد.";
        if (request.Icon?.Length > 50) return "نام آیکن حداکثر ۵۰ کاراکتر است.";
        if (request.Order is < 0 or > 100000) return "ترتیب باید بین صفر و ۱۰۰٬۰۰۰ باشد.";
        if (!IsSafeLink(request.Link)) return "پیوند معتبر نیست؛ از مسیر داخلی یا http، https، tel و mailto استفاده کنید.";

        if (request.ParentId is int parentId)
        {
            if (currentId == parentId) return "یک منو نمی‌تواند والد خودش باشد.";
            var parent = await _unitOfWork.MenuItems.GetByIdAsync(parentId);
            if (parent == null || parent.ParentId != null) return "والد باید یک منوی اصلی معتبر باشد.";
            if (request.IsActive && !parent.IsActive) return "ابتدا منوی والد را فعال کنید.";
            if (currentId.HasValue)
            {
                var items = await _unitOfWork.MenuItems.GetAllIncludingInactiveAsync();
                if (items.Any(item => item.ParentId == currentId.Value)) return "منوی دارای زیرمنو را نمی‌توان به زیرمنو تبدیل کرد.";
            }
        }
        return null;
    }

    private static string NormalizeLink(string link) => link switch
    {
        "/plans" => "/#plans", "/faq" => "/#faq", "/contact" => "/#contact",
        _ when link.StartsWith('#') => "/" + link,
        _ => link
    };

    private static bool IsSafeLink(string link)
    {
        if (link.Length is < 1 or > 200 || link.Any(char.IsControl) || link.Any(char.IsWhiteSpace) || link.Contains('\\')) return false;
        if (link.StartsWith("//", StringComparison.Ordinal) || Regex.IsMatch(link, "^/%2f", RegexOptions.IgnoreCase) || Regex.IsMatch(link, "%(0[0-9a-f]|1[0-9a-f]|7f|5c)", RegexOptions.IgnoreCase)) return false;
        if (link.StartsWith("/page/", StringComparison.Ordinal)) return Regex.IsMatch(link, "^/page/[a-z0-9]+(?:-[a-z0-9]+)*$");
        if (link.StartsWith('/')) return link != "/#";
        if (Regex.IsMatch(link, "^tel:\\+?[0-9۰-۹٠-٩()\\-]+$", RegexOptions.IgnoreCase)) return true;
        if (Regex.IsMatch(link, "^mailto:[^@\\s?]+@[^@\\s?]+\\.[^@\\s?]+$", RegexOptions.IgnoreCase)) return true;
        return Regex.IsMatch(link, "^https?://", RegexOptions.IgnoreCase)
            && Uri.TryCreate(link, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
            && !string.IsNullOrWhiteSpace(uri.Host) && string.IsNullOrEmpty(uri.UserInfo);
    }

    private static object ToDto(Domain.Entities.MenuItem item) => new
    {
        item.Id, item.Title, item.Icon, item.Link, item.Order, item.ParentId, item.IsActive
    };
}

public class CreateMenuItemRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string Link { get; set; } = string.Empty;
    public int Order { get; set; }
    public int? ParentId { get; set; }
    public bool IsActive { get; set; } = true;
}
