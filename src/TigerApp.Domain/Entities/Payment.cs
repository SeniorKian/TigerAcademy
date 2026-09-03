using TigerApp.Domain.Enums;
namespace TigerApp.Domain.Entities;

public class Payment : BaseEntity
{
    public int OrderId { get; set; }
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? Gateway { get; set; }
    public string? ReferenceId { get; set; }
    public string? CardNumber { get; set; } // Last 4 digits
    public string? BankReference { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? ResponseJson { get; set; }
    
    // Navigation
    public Order Order { get; set; } = null!;
}
