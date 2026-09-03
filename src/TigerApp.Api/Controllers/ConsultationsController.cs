using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TigerApp.Application.Common.Helpers;
using TigerApp.Application.Features.Consultations.Commands.CreateConsultation;
using TigerApp.Application.Features.Consultations.Commands.UpdateConsultation;
using TigerApp.Application.Features.Consultations.DTOs;
using TigerApp.Application.Features.Consultations.Queries.GetAllConsultations;
using TigerApp.Domain.Enums;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConsultationsController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IUnitOfWork _unitOfWork;

    public ConsultationsController(IMediator mediator, IUnitOfWork unitOfWork)
    {
        _mediator = mediator;
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// دریافت تمام مشاوره‌ها
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] bool? isActive, [FromQuery] ConsultationType? type, [FromQuery] string? city)
    {
        var result = await _mediator.Send(new GetAllConsultationsQuery
        {
            IsActive = isActive,
            Type = type,
            City = city
        });
        return Ok(result);
    }

    /// <summary>
    /// دریافت تمام مشاوره‌ها با صفحه‌بندی و فیلتر (ادمین)
    /// </summary>
    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin,Consultant")]
    public async Task<IActionResult> GetAllForAdmin(
        [FromQuery] string? search,
        [FromQuery] ConsultationType? type,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 10, 100);
        var consultations = await _unitOfWork.Consultations.GetAllIncludingInactiveAsync(cancellationToken);
        var query = consultations.OrderBy(c => c.Order).AsEnumerable();
        if (type.HasValue) query = query.Where(c => c.Type == type.Value);
        if (isActive.HasValue) query = query.Where(c => c.IsActive == isActive.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(c =>
                (c.Name?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
                || (c.City?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var filtered = query.ToList();
        var items = filtered.Skip((page - 1) * pageSize).Take(pageSize).Select(MapToDto).ToList();
        return Ok(new { items, page, pageSize, totalCount = filtered.Count, totalPages = (int)Math.Ceiling(filtered.Count / (double)pageSize) });
    }

    /// <summary>
    /// ایجاد مشاوره جدید (ادمین)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Consultant")]
    public async Task<IActionResult> Create([FromBody] CreateConsultationCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.IsSuccess)
            return CreatedAtAction(nameof(GetAll), result);
        return BadRequest(result);
    }

    /// <summary>
    /// ویرایش مشاوره (ادمین)
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Consultant")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateConsultationCommand command)
    {
        if (id != command.Id)
            return BadRequest("شناسه مشاوره مطابقت ندارد");

        var result = await _mediator.Send(command);
        if (result.IsSuccess)
            return Ok(result);
        return BadRequest(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Consultant")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var consultation = await _unitOfWork.Consultations.GetByIdAsync(id, cancellationToken);
        if (consultation == null) return NotFound(new { message = "مشاوره یافت نشد" });
        await _unitOfWork.Consultations.DeleteAsync(consultation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "مشاوره غیرفعال شد" });
    }

    private static ConsultationDto MapToDto(Domain.Entities.Consultation c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Type = c.Type,
        TypeName = c.Type switch
        {
            ConsultationType.Phone => "تلفنی",
            ConsultationType.InPerson => "حضوری",
            ConsultationType.Online => "آنلاین",
            _ => c.Type.ToString()
        },
        City = c.City,
        DurationMinutes = c.DurationMinutes,
        Price = c.Price,
        Description = c.Description,
        Order = c.Order,
        IsActive = c.IsActive,
        CreatedAt = c.CreatedAt,
        CreatedAtShamsi = c.CreatedAt.ToPersianDate()
    };
}
