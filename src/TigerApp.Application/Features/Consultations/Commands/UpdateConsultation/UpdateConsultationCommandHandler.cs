using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Common.Helpers;
using TigerApp.Application.Features.Consultations.DTOs;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Application.Features.Consultations.Commands.UpdateConsultation;

public class UpdateConsultationCommandHandler : IRequestHandler<UpdateConsultationCommand, Result<ConsultationDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateConsultationCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<ConsultationDto>> Handle(UpdateConsultationCommand request, CancellationToken cancellationToken)
    {
        var consultation = await _unitOfWork.Consultations.GetByIdAsync(request.Id);
        if (consultation == null)
            return Result<ConsultationDto>.Failure("مشاوره مورد نظر یافت نشد");

        consultation.Name = request.Name;
        consultation.Type = request.Type;
        consultation.City = request.City;
        consultation.DurationMinutes = request.DurationMinutes;
        consultation.Price = request.Price;
        consultation.Description = request.Description;
        consultation.Order = request.Order;
        consultation.IsActive = request.IsActive;
        consultation.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Consultations.UpdateAsync(consultation);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<ConsultationDto>.Success(MapToDto(consultation));
    }

    private static ConsultationDto MapToDto(Domain.Entities.Consultation c)
    {
        return new ConsultationDto
        {
            Id = c.Id,
            Name = c.Name,
            Type = c.Type,
            TypeName = c.Type switch
            {
                Domain.Enums.ConsultationType.Phone => "تلفنی",
                Domain.Enums.ConsultationType.InPerson => "حضوری",
                Domain.Enums.ConsultationType.Online => "آنلاین",
                _ => c.Type.ToString()
            },
            City = c.City,
            DurationMinutes = c.DurationMinutes,
            Price = c.Price,
            Description = c.Description,
            Order = c.Order,
            IsActive = c.IsActive,
            CreatedAt = c.CreatedAt,
            CreatedAtShamsi = c.CreatedAt.ToPersianDate()
        };
    }
}
