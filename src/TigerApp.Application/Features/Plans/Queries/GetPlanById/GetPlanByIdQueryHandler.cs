using TigerApp.Application.Common.Models;
using System.Text.Json;
using MediatR;
using TigerApp.Application.Common.Helpers;
using TigerApp.Application.Features.Plans.DTOs;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Application.Features.Plans.Queries.GetPlanById;

public class GetPlanByIdQueryHandler : IRequestHandler<GetPlanByIdQuery, Result<PlanDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPlanByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PlanDto>> Handle(GetPlanByIdQuery request, CancellationToken cancellationToken)
    {
        var plan = await _unitOfWork.Plans.GetByIdAsync(request.Id);
        if (plan == null)
            return Result<PlanDto>.Failure("طرح مورد نظر یافت نشد");

        return Result<PlanDto>.Success(MapToDto(plan));
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
