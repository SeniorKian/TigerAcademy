using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Common.Helpers;
using TigerApp.Application.Features.Consultations.DTOs;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Application.Features.Consultations.Queries.GetAllConsultations;

public class GetAllConsultationsQueryHandler : IRequestHandler<GetAllConsultationsQuery, Result<List<ConsultationDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllConsultationsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<List<ConsultationDto>>> Handle(GetAllConsultationsQuery request, CancellationToken cancellationToken)
    {
        var allConsultations = await _unitOfWork.Consultations.GetAllIncludingInactiveAsync(cancellationToken);

        var consultations = allConsultations.AsEnumerable();

        if (request.IsActive.HasValue)
            consultations = consultations.Where(c => c.IsActive == request.IsActive.Value);
        else
            consultations = consultations.Where(c => c.IsActive);
        if (request.Type.HasValue)
            consultations = consultations.Where(c => c.Type == request.Type.Value);
        if (!string.IsNullOrEmpty(request.City))
            consultations = consultations.Where(c => c.City == request.City);

        var dtos = consultations
            .OrderBy(c => c.Order)
            .Select(MapToDto)
            .ToList();

        return Result<List<ConsultationDto>>.Success(dtos);
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
