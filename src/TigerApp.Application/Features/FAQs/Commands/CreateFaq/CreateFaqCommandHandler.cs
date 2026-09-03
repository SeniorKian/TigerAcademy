using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Common.Helpers;
using TigerApp.Application.Features.FAQs.DTOs;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Application.Features.FAQs.Commands.CreateFaq;

public class CreateFaqCommandHandler : IRequestHandler<CreateFaqCommand, Result<FaqDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateFaqCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<FaqDto>> Handle(CreateFaqCommand request, CancellationToken cancellationToken)
    {
        var faq = new Faq
        {
            Question = request.Question,
            Answer = request.Answer,
            Category = request.Category,
            Order = request.Order,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Faqs.AddAsync(faq);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<FaqDto>.Success(MapToDto(faq));
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
