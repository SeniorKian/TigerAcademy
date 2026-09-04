using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TigerApp.Application.Features.Orders.Commands.CreateOrder;
using TigerApp.Application.Features.Orders.DTOs;
using TigerApp.Domain.Enums;
using TigerApp.Domain.Interfaces;
using TigerApp.Application.Common.Helpers;

namespace TigerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IUnitOfWork _unitOfWork;

    public OrdersController(IMediator mediator, IUnitOfWork unitOfWork)
    {
        _mediator = mediator;
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// دریافت سفارشات کاربر جاری
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMyOrders()
    {
        var userIdClaim = User.FindFirst("userId")?.Value
                       ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var orders = await _unitOfWork.Orders.GetAllAsync();
        var plans = await _unitOfWork.Plans.GetAllIncludingInactiveAsync();
        var consultations = await _unitOfWork.Consultations.GetAllIncludingInactiveAsync();
        var planLookup = plans.ToDictionary(p => p.Id, p => p.Name);
        var consultationLookup = consultations.ToDictionary(c => c.Id, c => c.Name);
        var userOrders = orders
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => MapToDto(o, planLookup, consultationLookup))
            .ToList();

        return Ok(userOrders);
    }

    /// <summary>
    /// ایجاد سفارش جدید
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.IsSuccess)
            return CreatedAtAction(nameof(GetMyOrders), result);
        return BadRequest(result);
    }

    /// <summary>
    /// دریافت تمام سفارشات (ادمین) با صفحه‌بندی و فیلتر
    /// </summary>
    [HttpGet("all")]
    [Authorize(Roles = "Admin,Consultant")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] OrderStatus? status,
        [FromQuery] OrderType? type,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 10, 100);
        var orders = await _unitOfWork.Orders.GetAllAsync(cancellationToken);
        var users = await _unitOfWork.Users.GetAllAsync(cancellationToken);
        var plans = await _unitOfWork.Plans.GetAllIncludingInactiveAsync(cancellationToken);
        var consultations = await _unitOfWork.Consultations.GetAllIncludingInactiveAsync(cancellationToken);
        var userLookup = users.ToDictionary(u => u.Id);
        var planLookup = plans.ToDictionary(p => p.Id, p => p.Name);
        var consultationLookup = consultations.ToDictionary(c => c.Id, c => c.Name);

        var dtos = orders
            .OrderByDescending(o => o.CreatedAt)
            .Select(o =>
            {
                var dto = MapToDto(o, planLookup, consultationLookup);
                if (userLookup.TryGetValue(o.UserId, out var user))
                {
                    dto.UserName = $"{user.FirstName} {user.LastName}".Trim();
                    dto.UserPhone = user.PhoneNumber;
                }
                return dto;
            });

        var query = dtos.AsEnumerable();
        if (status.HasValue) query = query.Where(o => o.Status == status.Value);
        if (type.HasValue) query = query.Where(o => o.Type == type.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(o =>
                (o.TrackingCode?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
                || (o.UserName?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
                || (o.UserPhone?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var filtered = query.ToList();
        var items = filtered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return Ok(new { items, page, pageSize, totalCount = filtered.Count, totalPages = (int)Math.Ceiling(filtered.Count / (double)pageSize) });
    }

    /// <summary>
    /// بروزرسانی وضعیت سفارش (ادمین)
    /// </summary>
    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Admin,Consultant")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(id);
        if (order == null)
            return NotFound("سفارش یافت نشد");

        order.Status = request.Status;
        order.Notes = request.Notes;
        order.UpdatedAt = DateTime.UtcNow;

        if (request.Status == OrderStatus.Paid)
        {
            order.PaidAt = DateTime.UtcNow;
            order.PaymentGateway = request.PaymentGateway;
        }

        await _unitOfWork.Orders.UpdateAsync(order);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { message = "وضعیت سفارش بروزرسانی شد" });
    }

    private static OrderDto MapToDto(Domain.Entities.Order o, IReadOnlyDictionary<int, string> plans, IReadOnlyDictionary<int, string> consultations)
    {
        return new OrderDto
        {
            Id = o.Id,
            UserId = o.UserId,
            Type = o.Type,
            TypeName = o.Type switch
            {
                OrderType.Plan => "طرح",
                OrderType.Consultation => "مشاوره",
                _ => o.Type.ToString()
            },
            PlanId = o.PlanId,
            PlanName = o.PlanId.HasValue && plans.TryGetValue(o.PlanId.Value, out var planName) ? planName : null,
            ConsultationId = o.ConsultationId,
            ConsultationName = o.ConsultationId.HasValue && consultations.TryGetValue(o.ConsultationId.Value, out var consultationName) ? consultationName : null,
            Amount = o.Amount,
            AmountFormatted = $"{o.Amount:N0} تومان",
            Status = o.Status,
            StatusName = o.Status switch
            {
                OrderStatus.Pending => "در انتظار پرداخت",
                OrderStatus.Processing => "در حال پردازش",
                OrderStatus.Paid => "پرداخت شده",
                OrderStatus.Completed => "تکمیل شده",
                OrderStatus.Failed => "ناموفق",
                OrderStatus.Cancelled => "لغو شده",
                OrderStatus.Refunded => "بازپرداخت شده",
                OrderStatus.Expired => "منقضی شده",
                _ => o.Status.ToString()
            },
            TrackingCode = o.TrackingCode,
            Notes = o.Notes,
            PreferredDate = o.PreferredDate,
            PreferredDateShamsi = o.PreferredDate?.ToPersianDate(),
            PreferredTimeRange = o.PreferredTimeRange,
            PaidAt = o.PaidAt,
            PaidAtShamsi = o.PaidAt.HasValue ? o.PaidAt.Value.ToPersianDateTime() : null,
            IsActive = o.IsActive,
            CreatedAt = o.CreatedAt,
            CreatedAtShamsi = o.CreatedAt.ToPersianDateTime()
        };
    }
}

public class UpdateOrderStatusRequest
{
    public OrderStatus Status { get; set; }
    public string? Notes { get; set; }
    public string? PaymentGateway { get; set; }
}
