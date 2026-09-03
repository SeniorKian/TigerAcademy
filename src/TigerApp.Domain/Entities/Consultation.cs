using TigerApp.Domain.Enums;
namespace TigerApp.Domain.Entities;

public class Consultation : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public ConsultationType Type { get; set; }
    public string? City { get; set; } // For in-person consultations
    public int? DurationMinutes { get; set; } // For phone consultations
    public decimal Price { get; set; }
    public string? Description { get; set; }
    public int Order { get; set; }
    
    // Navigation
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
