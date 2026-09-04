using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Features.Orders.DTOs;
using TigerApp.Domain.Enums;

namespace TigerApp.Application.Features.Orders.Commands.CreateOrder;

public class CreateOrderCommand : IRequest<Result<OrderDto>>
{
    public OrderType Type { get; set; }
    public int? PlanId { get; set; }
    public int? ConsultationId { get; set; }
    public string? Notes { get; set; }
    public string? PreferredDateShamsi { get; set; }
    public string? PreferredTimeRange { get; set; }
}
