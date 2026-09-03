using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Features.Plans.DTOs;

namespace TigerApp.Application.Features.Plans.Queries.GetPlanById;

public class GetPlanByIdQuery : IRequest<Result<PlanDto>>
{
    public int Id { get; set; }
}
