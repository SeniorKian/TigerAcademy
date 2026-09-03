using TigerApp.Domain.Enums;
namespace TigerApp.Domain.Entities;

public class City : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int ProvinceId { get; set; }
    public int Order { get; set; }
    
    // Navigation
    public Province Province { get; set; } = null!;
}
