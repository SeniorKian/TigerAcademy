using TigerApp.Domain.Enums;
namespace TigerApp.Domain.Entities;

public class Content : BaseEntity
{
    public string Key { get; set; } = string.Empty; // e.g., "home.hero.title"
    public string Value { get; set; } = string.Empty;
    public ContentType Type { get; set; } = ContentType.Text;
    public string Page { get; set; } = "home";
    public string? Section { get; set; }
    public int Order { get; set; }
    public string? Language { get; set; } = "fa";
}
