using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Features.Plans.DTOs;

namespace TigerApp.Application.Features.Plans.Commands.UpdatePlan;

public class UpdatePlanCommand : IRequest<Result<PlanDto>>
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public string? VideoUrl { get; set; }
    public List<string> Features { get; set; } = new();
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;
}
