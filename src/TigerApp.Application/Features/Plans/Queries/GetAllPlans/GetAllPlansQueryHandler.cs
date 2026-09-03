using TigerApp.Application.Common.Models;
using System.Text.Json;
using MediatR;
using TigerApp.Application.Common.Helpers;
using TigerApp.Application.Features.Plans.DTOs;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Application.Features.Plans.Queries.GetAllPlans;

public class GetAllPlansQueryHandler : IRequestHandler<GetAllPlansQuery, Result<List<PlanDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllPlansQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<List<PlanDto>>> Handle(GetAllPlansQuery request, CancellationToken cancellationToken)
    {
        var allPlans = await _unitOfWork.Plans.GetAllIncludingInactiveAsync(cancellationToken);
        
        var plans = allPlans.AsEnumerable();
        
        if (request.IsActive.HasValue)
            plans = plans.Where(p => p.IsActive == request.IsActive.Value);
        else
            plans = plans.Where(p => p.IsActive);

        var dtos = plans
            .OrderBy(p => p.Order)
            .Select(MapToDto)
            .ToList();

        return Result<List<PlanDto>>.Success(dtos);
    }

    private static PlanDto MapToDto(Plan plan)
    {
        return new PlanDto
        {
            Id = plan.Id,
            Name = plan.Name,
            Description = plan.Description,
            Price = plan.Price,
            ImageUrl = plan.ImageUrl,
            VideoUrl = plan.VideoUrl,
            Features = string.IsNullOrEmpty(plan.Features)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(plan.Features) ?? new List<string>(),
            Order = plan.Order,
            IsActive = plan.IsActive,
            CreatedAt = plan.CreatedAt,
            CreatedAtShamsi = plan.CreatedAt.ToPersianDate()
        };
    }
}
