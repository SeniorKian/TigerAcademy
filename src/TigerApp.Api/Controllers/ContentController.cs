using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TigerApp.Application.Features.Content.Commands.CreateContent;
using TigerApp.Application.Features.Content.DTOs;
using TigerApp.Application.Features.Content.Queries.GetContentByKey;
using TigerApp.Application.Common.Helpers;
using TigerApp.Domain.Enums;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContentController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IWebHostEnvironment _environment;

    public ContentController(IMediator mediator, IUnitOfWork unitOfWork, IWebHostEnvironment environment)
    {
        _mediator = mediator;
        _unitOfWork = unitOfWork;
        _environment = environment;
    }

    /// <summary>
    /// دریافت محتوای صفحه
    /// </summary>
    [HttpGet("{page}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByPage(string page, [FromQuery] string? section, [FromQuery] string language = "fa")
    {
        var result = await _mediator.Send(new GetContentByKeyQuery
        {
            Page = page,
            Section = section,
            Language = language
        });
        return Ok(result);
    }

    /// <summary>
    /// ایجاد محتوای جدید (ادمین)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> Create([FromBody] CreateContentCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.IsSuccess)
            return CreatedAtAction(nameof(GetByPage), new { page = result.Data!.Page }, result);
        return BadRequest(result);
    }

    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> GetAllForAdmin(
        [FromQuery] string? search,
        [FromQuery] string? page,
        [FromQuery] ContentType? type,
        [FromQuery] bool? isActive,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 10, 100);
        var contents = await _unitOfWork.Contents.GetAllIncludingInactiveAsync(cancellationToken);
        var query = contents.OrderBy(c => c.Page).ThenBy(c => c.Section).ThenBy(c => c.Order).AsEnumerable();
        if (!string.IsNullOrWhiteSpace(page)) query = query.Where(c => c.Page == page);
        if (type.HasValue) query = query.Where(c => c.Type == type.Value);
        if (isActive.HasValue) query = query.Where(c => c.IsActive == isActive.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(c =>
                (c.Key?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
                || (c.Value?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var filtered = query.ToList();
        var items = filtered.Skip((pageNumber - 1) * pageSize).Take(pageSize).Select(MapToDto).ToList();
        return Ok(new { items, page = pageNumber, pageSize, totalCount = filtered.Count, totalPages = (int)Math.Ceiling(filtered.Count / (double)pageSize) });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateContentRequest request, CancellationToken cancellationToken)
    {
        var error = Validate(request.Key, request.Value, request.Page);
        if (error != null) return BadRequest(new { message = error });

        var content = await _unitOfWork.Contents.GetByIdAsync(id, cancellationToken);
        if (content == null) return NotFound(new { message = "محتوا یافت نشد" });
        content.Key = request.Key.Trim();
        content.Value = request.Value.Trim();
        content.Type = request.Type;
        content.Page = request.Page.Trim().ToLowerInvariant();
        content.Section = string.IsNullOrWhiteSpace(request.Section) ? null : request.Section.Trim();
        content.Order = request.Order;
        content.Language = string.IsNullOrWhiteSpace(request.Language) ? "fa" : request.Language.Trim().ToLowerInvariant();
        content.IsActive = request.IsActive;
        content.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.Contents.UpdateAsync(content, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(MapToDto(content));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var content = await _unitOfWork.Contents.GetByIdAsync(id, cancellationToken);
        if (content == null) return NotFound(new { message = "محتوا یافت نشد" });
        await _unitOfWork.Contents.DeleteAsync(content, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "محتوا غیرفعال شد" });
    }

    [HttpPost("upload")]
    [Authorize(Roles = "Admin,ContentManager")]
    [RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0) return BadRequest(new { message = "فایل خالی است" });
        if (file.Length > 25 * 1024 * 1024) return BadRequest(new { message = "حجم فایل نباید بیشتر از ۲۵ مگابایت باشد" });

        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            { ".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".ogg" };
        var extension = Path.GetExtension(file.FileName);
        if (!allowed.Contains(extension)) return BadRequest(new { message = "فرمت فایل پشتیبانی نمی‌شود" });

        var relativeFolder = Path.Combine("uploads", DateTime.UtcNow.ToString("yyyy-MM"));
        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var folder = Path.Combine(webRoot, relativeFolder);
        Directory.CreateDirectory(folder);
        var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        await using var stream = System.IO.File.Create(Path.Combine(folder, fileName));
        await file.CopyToAsync(stream, cancellationToken);
        var url = "/" + Path.Combine(relativeFolder, fileName).Replace('\\', '/');
        return Ok(new { url, fileName = file.FileName, size = file.Length });
    }

    private static string? Validate(string key, string value, string page)
    {
        if (string.IsNullOrWhiteSpace(key)) return "کلید محتوا الزامی است";
        if (string.IsNullOrWhiteSpace(value)) return "مقدار محتوا الزامی است";
        if (string.IsNullOrWhiteSpace(page)) return "صفحه الزامی است";
        if (value.Length > 4000) return "مقدار محتوا نباید بیشتر از ۴۰۰۰ کاراکتر باشد";
        return null;
    }

    private static ContentDto MapToDto(Domain.Entities.Content c) => new()
    {
        Id = c.Id, Key = c.Key, Value = c.Value, Type = c.Type,
        TypeName = c.Type switch
        {
            ContentType.Text => "متن", ContentType.Image => "تصویر", ContentType.Video => "ویدیو",
            ContentType.Html => "HTML", ContentType.Banner => "بنر", ContentType.Slider => "اسلایدر",
            _ => c.Type.ToString()
        },
        Page = c.Page, Section = c.Section, Order = c.Order, Language = c.Language,
        IsActive = c.IsActive, CreatedAt = c.CreatedAt, CreatedAtShamsi = c.CreatedAt.ToPersianDate()
    };
}

public sealed class UpdateContentRequest
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public ContentType Type { get; set; }
    public string Page { get; set; } = "home";
    public string? Section { get; set; }
    public int Order { get; set; }
    public string Language { get; set; } = "fa";
    public bool IsActive { get; set; } = true;
}
