using TigerApp.Domain.Enums;
namespace TigerApp.Domain.Entities;

public class Province : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    
    // Navigation
    public ICollection<City> Cities { get; set; } = new List<City>();
}
