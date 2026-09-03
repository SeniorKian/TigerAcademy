using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Common.Helpers;
using TigerApp.Application.Features.Consultations.DTOs;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Application.Features.Consultations.Commands.CreateConsultation;

public class CreateConsultationCommandHandler : IRequestHandler<CreateConsultationCommand, Result<ConsultationDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateConsultationCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<ConsultationDto>> Handle(CreateConsultationCommand request, CancellationToken cancellationToken)
    {
        var consultation = new Consultation
        {
            Name = request.Name,
            Type = request.Type,
            City = request.City,
            DurationMinutes = request.DurationMinutes,
            Price = request.Price,
            Description = request.Description,
            Order = request.Order,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Consultations.AddAsync(consultation);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<ConsultationDto>.Success(MapToDto(consultation));
    }

    private static ConsultationDto MapToDto(Consultation c)
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
