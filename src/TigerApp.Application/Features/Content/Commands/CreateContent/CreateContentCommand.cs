using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Features.Content.DTOs;
using TigerApp.Domain.Enums;

namespace TigerApp.Application.Features.Content.Commands.CreateContent;

public class CreateContentCommand : IRequest<Result<ContentDto>>
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public ContentType Type { get; set; } = ContentType.Text;
    public string Page { get; set; } = "home";
    public string? Section { get; set; }
    public int Order { get; set; }
    public string? Language { get; set; } = "fa";
    public bool IsActive { get; set; } = true;
}
