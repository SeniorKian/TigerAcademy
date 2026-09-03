using TigerApp.Domain.Enums;

namespace TigerApp.Application.Features.Orders.DTOs;

public class OrderDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserPhone { get; set; }
    public OrderType Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public int? PlanId { get; set; }
    public string? PlanName { get; set; }
    public int? ConsultationId { get; set; }
    public string? ConsultationName { get; set; }
    public decimal Amount { get; set; }
    public string AmountFormatted { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string? TrackingCode { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? PaidAtShamsi { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedAtShamsi { get; set; }
}
