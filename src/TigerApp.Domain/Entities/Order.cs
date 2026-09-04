using TigerApp.Domain.Enums;
namespace TigerApp.Domain.Entities;

public class Order : BaseEntity
{
    public int UserId { get; set; }
    public OrderType Type { get; set; }
    public int? PlanId { get; set; }
    public int? ConsultationId { get; set; }
    public decimal Amount { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public string? TrackingCode { get; set; }
    public string? PaymentGateway { get; set; }
    public string? PaymentReference { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? Notes { get; set; }
    public DateTime? PreferredDate { get; set; }
    public string? PreferredTimeRange { get; set; }
    
    // Navigation
    public User User { get; set; } = null!;
    public Plan? Plan { get; set; }
    public Consultation? Consultation { get; set; }
    public Payment? Payment { get; set; }
}
