using TigerApp.Domain.Enums;

namespace TigerApp.Application.Features.Consultations.DTOs;

public class CreateConsultationRequest
{
    public string Name { get; set; } = string.Empty;
    public ConsultationType Type { get; set; }
    public string? City { get; set; }
    public int? DurationMinutes { get; set; }
    public decimal Price { get; set; }
    public string? Description { get; set; }
    public int Order { get; set; }
}
