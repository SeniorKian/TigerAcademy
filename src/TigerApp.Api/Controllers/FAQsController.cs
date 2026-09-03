using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TigerApp.Application.Features.FAQs.Commands.CreateFaq;
using TigerApp.Application.Features.FAQs.DTOs;
using TigerApp.Application.Features.FAQs.Queries.GetAllFaqs;
using TigerApp.Application.Common.Helpers;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FAQsController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IUnitOfWork _unitOfWork;

    public FAQsController(IMediator mediator, IUnitOfWork unitOfWork)
    {
        _mediator = mediator;
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// دریافت تمام سوالات متداول
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] string? category)
    {
        var result = await _mediator.Send(new GetAllFaqsQuery { Category = category });
        return Ok(result);
    }

    /// <summary>
    /// ایجاد سوال متداول جدید (ادمین)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> Create([FromBody] CreateFaqCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.IsSuccess)
            return CreatedAtAction(nameof(GetAll), result);
        return BadRequest(result);
    }

    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> GetAllForAdmin(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 10, 100);
        var faqs = await _unitOfWork.Faqs.GetAllIncludingInactiveAsync(cancellationToken);
        var query = faqs.OrderBy(f => f.Order).AsEnumerable();
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(f => f.Category == category);
        if (isActive.HasValue) query = query.Where(f => f.IsActive == isActive.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(f =>
                (f.Question?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
                || (f.Answer?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var filtered = query.ToList();
        var items = filtered.Skip((page - 1) * pageSize).Take(pageSize).Select(MapToDto).ToList();
        return Ok(new { items, page, pageSize, totalCount = filtered.Count, totalPages = (int)Math.Ceiling(filtered.Count / (double)pageSize) });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateFaqRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Question) || string.IsNullOrWhiteSpace(request.Answer))
            return BadRequest(new { message = "سؤال و پاسخ الزامی است" });
        var faq = await _unitOfWork.Faqs.GetByIdAsync(id, cancellationToken);
        if (faq == null) return NotFound(new { message = "سؤال یافت نشد" });
        faq.Question = request.Question.Trim();
        faq.Answer = request.Answer.Trim();
        faq.Category = string.IsNullOrWhiteSpace(request.Category) ? null : request.Category.Trim();
        faq.Order = request.Order;
        faq.IsActive = request.IsActive;
        faq.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.Faqs.UpdateAsync(faq, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(MapToDto(faq));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var faq = await _unitOfWork.Faqs.GetByIdAsync(id, cancellationToken);
        if (faq == null) return NotFound(new { message = "سؤال یافت نشد" });
        await _unitOfWork.Faqs.DeleteAsync(faq, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "سؤال غیرفعال شد" });
    }

    private static FaqDto MapToDto(Domain.Entities.Faq faq) => new()
    {
        Id = faq.Id, Question = faq.Question, Answer = faq.Answer, Category = faq.Category,
        Order = faq.Order, IsActive = faq.IsActive, CreatedAt = faq.CreatedAt,
        CreatedAtShamsi = faq.CreatedAt.ToPersianDate()
    };
}

public sealed class UpdateFaqRequest
{
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string? Category { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;
}
