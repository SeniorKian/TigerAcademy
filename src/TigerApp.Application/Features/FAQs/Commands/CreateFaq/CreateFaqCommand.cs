using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Features.FAQs.DTOs;

namespace TigerApp.Application.Features.FAQs.Commands.CreateFaq;

public class CreateFaqCommand : IRequest<Result<FaqDto>>
{
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string? Category { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;
}
