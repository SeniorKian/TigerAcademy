using TigerApp.Application.Common.Models;
using System.Text.Json;
using MediatR;
using TigerApp.Application.Common.Helpers;
using TigerApp.Application.Features.Plans.DTOs;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Application.Features.Plans.Commands.UpdatePlan;

public class UpdatePlanCommandHandler : IRequestHandler<UpdatePlanCommand, Result<PlanDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdatePlanCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PlanDto>> Handle(UpdatePlanCommand request, CancellationToken cancellationToken)
    {
        var plan = await _unitOfWork.Plans.GetByIdAsync(request.Id);
        if (plan == null)
            return Result<PlanDto>.Failure("طرح مورد نظر یافت نشد");

        plan.Name = request.Name;
        plan.Description = request.Description;
        plan.Price = request.Price;
        plan.ImageUrl = request.ImageUrl;
        plan.VideoUrl = request.VideoUrl;
        plan.Features = JsonSerializer.Serialize(request.Features);
        plan.Order = request.Order;
        plan.IsActive = request.IsActive;
        plan.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Plans.UpdateAsync(plan);
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
