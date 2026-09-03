using TigerApp.Application.Common.Models;
using MediatR;

namespace TigerApp.Application.Features.Plans.Commands.DeletePlan;

public class DeletePlanCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
