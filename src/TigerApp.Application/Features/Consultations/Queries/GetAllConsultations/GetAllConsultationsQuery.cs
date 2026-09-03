using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Features.Consultations.DTOs;
using TigerApp.Domain.Enums;

namespace TigerApp.Application.Features.Consultations.Queries.GetAllConsultations;

public class GetAllConsultationsQuery : IRequest<Result<List<ConsultationDto>>>
{
    public bool? IsActive { get; set; }
    public ConsultationType? Type { get; set; }
    public string? City { get; set; }
}
