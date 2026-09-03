using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Common.Helpers;
using TigerApp.Application.Features.FAQs.DTOs;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Application.Features.FAQs.Queries.GetAllFaqs;

public class GetAllFaqsQueryHandler : IRequestHandler<GetAllFaqsQuery, Result<List<FaqDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllFaqsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<List<FaqDto>>> Handle(GetAllFaqsQuery request, CancellationToken cancellationToken)
    {
        var allFaqs = await _unitOfWork.Faqs.GetAllAsync();

        var faqs = allFaqs.AsEnumerable();

        faqs = faqs.Where(f => f.IsActive);

        if (!string.IsNullOrEmpty(request.Category))
            faqs = faqs.Where(f => f.Category == request.Category);

        var dtos = faqs
            .OrderBy(f => f.Order)
            .Select(MapToDto)
            .ToList();

        return Result<List<FaqDto>>.Success(dtos);
    }

    private static FaqDto MapToDto(Faq faq)
    {
        return new FaqDto
        {
            Id = faq.Id,
            Question = faq.Question,
            Answer = faq.Answer,
            Category = faq.Category,
            Order = faq.Order,
            IsActive = faq.IsActive,
            CreatedAt = faq.CreatedAt,
            CreatedAtShamsi = faq.CreatedAt.ToPersianDate()
        };
    }
}
