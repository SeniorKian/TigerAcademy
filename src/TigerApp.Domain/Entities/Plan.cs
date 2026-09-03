using TigerApp.Domain.Enums;
namespace TigerApp.Domain.Entities;

public class Plan : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public string? VideoUrl { get; set; }
    public string? Features { get; set; } // JSON array of features
    public int Order { get; set; }
    
    // Navigation
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
