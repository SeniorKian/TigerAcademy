using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Application.Features.Plans.Commands.DeletePlan;

public class DeletePlanCommandHandler : IRequestHandler<DeletePlanCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeletePlanCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(DeletePlanCommand request, CancellationToken cancellationToken)
    {
        var plan = await _unitOfWork.Plans.GetByIdAsync(request.Id);
        if (plan == null)
            return Result<bool>.Failure("طرح مورد نظر یافت نشد");

        // Soft delete
        plan.IsActive = false;
        plan.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Plans.UpdateAsync(plan);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
