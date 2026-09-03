using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Common.Helpers;
using TigerApp.Application.Features.Content.DTOs;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Enums;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Application.Features.Content.Commands.CreateContent;

public class CreateContentCommandHandler : IRequestHandler<CreateContentCommand, Result<ContentDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateContentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<ContentDto>> Handle(CreateContentCommand request, CancellationToken cancellationToken)
    {
        var content = new Domain.Entities.Content
        {
            Key = request.Key,
            Value = request.Value,
            Type = request.Type,
            Page = request.Page,
            Section = request.Section,
            Order = request.Order,
            Language = request.Language,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Contents.AddAsync(content);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<ContentDto>.Success(MapToDto(content));
    }

    private static ContentDto MapToDto(Domain.Entities.Content c)
    {
        return new ContentDto
        {
            Id = c.Id,
            Key = c.Key,
            Value = c.Value,
            Type = c.Type,
            TypeName = c.Type switch
            {
                ContentType.Text => "متن",
                ContentType.Image => "تصویر",
                ContentType.Video => "ویدیو",
                ContentType.Html => "HTML",
                ContentType.Banner => "بنر",
                ContentType.Slider => "اسلایدر",
                _ => c.Type.ToString()
            },
            Page = c.Page,
            Section = c.Section,
            Order = c.Order,
            Language = c.Language,
            IsActive = c.IsActive,
            CreatedAt = c.CreatedAt,
            CreatedAtShamsi = c.CreatedAt.ToPersianDate()
        };
    }
}
