using System.Text.Json;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TigerApp.Application.Common.Helpers;
using TigerApp.Application.Features.Plans.Commands.CreatePlan;
using TigerApp.Application.Features.Plans.Commands.DeletePlan;
using TigerApp.Application.Features.Plans.Commands.UpdatePlan;
using TigerApp.Application.Features.Plans.DTOs;
using TigerApp.Application.Features.Plans.Queries.GetAllPlans;
using TigerApp.Application.Features.Plans.Queries.GetPlanById;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlansController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IUnitOfWork _unitOfWork;

    public PlansController(IMediator mediator, IUnitOfWork unitOfWork)
    {
        _mediator = mediator;
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// دریافت تمام طرح‌ها با صفحه‌بندی و فیلتر (ادمین)
    /// </summary>
    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> GetAllForAdmin(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 10, 100);
        var plans = await _unitOfWork.Plans.GetAllIncludingInactiveAsync(cancellationToken);
        var query = plans.OrderBy(p => p.Order).AsEnumerable();
        if (isActive.HasValue) query = query.Where(p => p.IsActive == isActive.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(p => p.Name?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false);
        }

        var filtered = query.ToList();
        var items = filtered.Skip((page - 1) * pageSize).Take(pageSize).Select(MapToDto).ToList();
        return Ok(new { items, page, pageSize, totalCount = filtered.Count, totalPages = (int)Math.Ceiling(filtered.Count / (double)pageSize) });
    }

    /// <summary>
    /// دریافت تمام طرح‌ها
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] bool? isActive)
    {
        var result = await _mediator.Send(new GetAllPlansQuery { IsActive = isActive });
        return Ok(result);
    }

    /// <summary>
    /// دریافت طرح با شناسه
    /// </summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _mediator.Send(new GetPlanByIdQuery { Id = id });
        if (result.IsSuccess)
            return Ok(result);
        return NotFound(result);
    }

    /// <summary>
    /// ایجاد طرح جدید (ادمین)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> Create([FromBody] CreatePlanCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.IsSuccess)
            return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
        return BadRequest(result);
    }

    /// <summary>
    /// ویرایش طرح (ادمین)
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePlanCommand command)
    {
        if (id != command.Id)
            return BadRequest("شناسه طرح مطابقت ندارد");

        var result = await _mediator.Send(command);
        if (result.IsSuccess)
            return Ok(result);
        return BadRequest(result);
    }

    /// <summary>
    /// حذف طرح (ادمین)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,ContentManager")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _mediator.Send(new DeletePlanCommand { Id = id });
        if (result.IsSuccess)
            return Ok(result);
        return NotFound(result);
    }

    private static PlanDto MapToDto(Domain.Entities.Plan plan) => new()
    {
        Id = plan.Id,
        Name = plan.Name,
        Description = plan.Description,
        Price = plan.Price,
        ImageUrl = plan.ImageUrl,
        VideoUrl = plan.VideoUrl,
        Features = string.IsNullOrEmpty(plan.Features)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(plan.Features) ?? new List<string>(),
        Order = plan.Order,
        IsActive = plan.IsActive,
        CreatedAt = plan.CreatedAt,
        CreatedAtShamsi = plan.CreatedAt.ToPersianDate()
    };
}
