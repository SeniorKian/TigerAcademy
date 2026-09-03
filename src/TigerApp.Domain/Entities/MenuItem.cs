using TigerApp.Domain.Enums;
namespace TigerApp.Domain.Entities;

public class MenuItem : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string Link { get; set; } = string.Empty;
    public int Order { get; set; }
    public int? ParentId { get; set; }
    public MenuItem? Parent { get; set; }
    public ICollection<MenuItem> Children { get; set; } = new List<MenuItem>();
}
