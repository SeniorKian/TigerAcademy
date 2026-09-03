using TigerApp.Domain.Enums;
namespace TigerApp.Domain.Entities;

public class Quota : BaseEntity
{
    public string Name { get; set; } = string.Empty; // e.g., "۵٪", "۲۵٪", "منطقه ۱"
    public string? Description { get; set; }
    public int Order { get; set; }
}
