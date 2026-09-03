using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Common.Helpers;
using TigerApp.Application.Features.Content.DTOs;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Enums;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Application.Features.Content.Queries.GetContentByKey;

public class GetContentByKeyQueryHandler : IRequestHandler<GetContentByKeyQuery, Result<List<ContentDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetContentByKeyQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<List<ContentDto>>> Handle(GetContentByKeyQuery request, CancellationToken cancellationToken)
    {
        var allContents = await _unitOfWork.Contents.GetAllAsync();

        var contents = allContents.AsEnumerable();

        contents = contents.Where(c =>
            c.Page == request.Page &&
            c.IsActive);

        if (!string.IsNullOrEmpty(request.Section))
            contents = contents.Where(c => c.Section == request.Section);
        if (!string.IsNullOrEmpty(request.Language))
            contents = contents.Where(c => c.Language == request.Language);

        var dtos = contents
            .OrderBy(c => c.Order)
            .Select(MapToDto)
            .ToList();

        return Result<List<ContentDto>>.Success(dtos);
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
