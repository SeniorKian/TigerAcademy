using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Features.Content.DTOs;

namespace TigerApp.Application.Features.Content.Queries.GetContentByKey;

public class GetContentByKeyQuery : IRequest<Result<List<ContentDto>>>
{
    public string Page { get; set; } = "home";
    public string? Section { get; set; }
    public string? Language { get; set; } = "fa";
}
