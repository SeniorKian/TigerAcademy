using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Features.FAQs.DTOs;

namespace TigerApp.Application.Features.FAQs.Queries.GetAllFaqs;

public class GetAllFaqsQuery : IRequest<Result<List<FaqDto>>>
{
    public string? Category { get; set; }
}
