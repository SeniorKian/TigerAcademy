using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Features.Consultations.DTOs;
using TigerApp.Domain.Enums;

namespace TigerApp.Application.Features.Consultations.Commands.CreateConsultation;

public class CreateConsultationCommand : IRequest<Result<ConsultationDto>>
{
    public string Name { get; set; } = string.Empty;
    public ConsultationType Type { get; set; }
    public string? City { get; set; }
    public int? DurationMinutes { get; set; }
    public decimal Price { get; set; }
    public string? Description { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;
}
