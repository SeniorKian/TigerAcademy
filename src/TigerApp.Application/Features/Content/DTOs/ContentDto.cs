using TigerApp.Domain.Enums;

namespace TigerApp.Application.Features.Content.DTOs;

public class ContentDto
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public ContentType Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public string Page { get; set; } = "home";
    public string? Section { get; set; }
    public int Order { get; set; }
    public string? Language { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedAtShamsi { get; set; }
}
