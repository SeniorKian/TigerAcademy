namespace TigerApp.Application.Features.Plans.DTOs;

public class UpdatePlanRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public string? VideoUrl { get; set; }
    public List<string> Features { get; set; } = new();
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;
}
