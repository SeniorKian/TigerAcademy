using TigerApp.Domain.Enums;
namespace TigerApp.Domain.Entities;

public class Faq : BaseEntity
{
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string? Category { get; set; }
    public int Order { get; set; }
}
