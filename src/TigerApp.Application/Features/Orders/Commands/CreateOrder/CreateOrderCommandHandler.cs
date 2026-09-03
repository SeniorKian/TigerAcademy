using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Common.Helpers;
using TigerApp.Application.Features.Orders.DTOs;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Enums;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Application.Features.Orders.Commands.CreateOrder;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Result<OrderDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public CreateOrderCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<Result<OrderDto>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (userId == null)
            return Result<OrderDto>.Failure("کاربر یافت نشد");

        decimal amount;
        string? itemName = null;

        if (request.Type == OrderType.Plan)
        {
            if (!request.PlanId.HasValue || request.ConsultationId.HasValue)
                return Result<OrderDto>.Failure("شناسه طرح معتبر نیست");
            var plan = await _unitOfWork.Plans.GetByIdAsync(request.PlanId.Value);
            if (plan == null || !plan.IsActive)
                return Result<OrderDto>.Failure("طرح مورد نظر یافت نشد");
            amount = plan.Price;
            itemName = plan.Name;
        }
        else if (request.Type == OrderType.Consultation)
        {
            if (!request.ConsultationId.HasValue || request.PlanId.HasValue)
                return Result<OrderDto>.Failure("شناسه مشاوره معتبر نیست");
            var consultation = await _unitOfWork.Consultations.GetByIdAsync(request.ConsultationId.Value);
            if (consultation == null || !consultation.IsActive)
                return Result<OrderDto>.Failure("مشاوره مورد نظر یافت نشد");
            amount = consultation.Price;
            itemName = consultation.Name;
        }
        else
        {
            return Result<OrderDto>.Failure("نوع سفارش معتبر نیست");
        }

        // Generate tracking code
        var trackingCode = $"TA-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 10000)}";

        var order = new Order
        {
            UserId = userId.Value,
            Type = request.Type,
            PlanId = request.PlanId,
            ConsultationId = request.ConsultationId,
            Amount = amount,
            Status = OrderStatus.Pending,
            TrackingCode = trackingCode,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Orders.AddAsync(order);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<OrderDto>.Success(MapToDto(order, itemName));
    }

    private static OrderDto MapToDto(Order order, string? itemName = null)
    {
        return new OrderDto
        {
            Id = order.Id,
            UserId = order.UserId,
            Type = order.Type,
            TypeName = order.Type switch
            {
                OrderType.Plan => "طرح",
                OrderType.Consultation => "مشاوره",
                _ => order.Type.ToString()
            },
            PlanId = order.PlanId,
            PlanName = order.Type == OrderType.Plan ? itemName : null,
            ConsultationId = order.ConsultationId,
            ConsultationName = order.Type == OrderType.Consultation ? itemName : null,
            Amount = order.Amount,
            AmountFormatted = $"{order.Amount:N0} تومان",
            Status = order.Status,
            StatusName = order.Status switch
            {
                OrderStatus.Pending => "در انتظار پرداخت",
                OrderStatus.Paid => "پرداخت شده",
                OrderStatus.Completed => "تکمیل شده",
                OrderStatus.Cancelled => "لغو شده",
                OrderStatus.Expired => "منقضی شده",
                _ => order.Status.ToString()
            },
            TrackingCode = order.TrackingCode,
            Notes = order.Notes,
            IsActive = order.IsActive,
            CreatedAt = order.CreatedAt,
            CreatedAtShamsi = order.CreatedAt.ToPersianDateTime()
        };
    }
}
