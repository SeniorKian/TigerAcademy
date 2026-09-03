using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Features.Plans.DTOs;

namespace TigerApp.Application.Features.Plans.Queries.GetAllPlans;

public class GetAllPlansQuery : IRequest<Result<List<PlanDto>>>
{
    public bool? IsActive { get; set; }
}
