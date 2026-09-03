using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Features.Consultations.DTOs;
using TigerApp.Domain.Enums;

namespace TigerApp.Application.Features.Consultations.Commands.UpdateConsultation;

public class UpdateConsultationCommand : IRequest<Result<ConsultationDto>>
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ConsultationType Type { get; set; }
    public string? City { get; set; }
    public int? DurationMinutes { get; set; }
    public decimal Price { get; set; }
    public string? Description { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;
}
