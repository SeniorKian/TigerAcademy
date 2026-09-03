using TigerApp.Domain.Enums;

namespace TigerApp.Application.Features.Consultations.DTOs;

public class ConsultationDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ConsultationType Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public string? City { get; set; }
    public int? DurationMinutes { get; set; }
    public decimal Price { get; set; }
    public string? Description { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedAtShamsi { get; set; }
}
