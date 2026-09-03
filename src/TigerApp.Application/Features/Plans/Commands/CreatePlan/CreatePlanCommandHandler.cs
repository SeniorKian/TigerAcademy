using TigerApp.Application.Common.Models;
using System.Text.Json;
using MediatR;
using TigerApp.Application.Common.Helpers;
using TigerApp.Application.Features.Plans.DTOs;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Application.Features.Plans.Commands.CreatePlan;

public class CreatePlanCommandHandler : IRequestHandler<CreatePlanCommand, Result<PlanDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreatePlanCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PlanDto>> Handle(CreatePlanCommand request, CancellationToken cancellationToken)
    {
        var plan = new Plan
        {
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            ImageUrl = request.ImageUrl,
            VideoUrl = request.VideoUrl,
            Features = JsonSerializer.Serialize(request.Features),
            Order = request.Order,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Plans.AddAsync(plan);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

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
