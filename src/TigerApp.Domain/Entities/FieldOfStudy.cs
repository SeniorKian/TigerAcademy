using TigerApp.Domain.Enums;
namespace TigerApp.Domain.Entities;

public class FieldOfStudy : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public int Order { get; set; }
}
