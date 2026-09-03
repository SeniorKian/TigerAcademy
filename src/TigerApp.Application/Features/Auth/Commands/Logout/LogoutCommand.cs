using MediatR;
using TigerApp.Application.Common.Models;

namespace TigerApp.Application.Features.Auth.Commands.Logout;

public record LogoutCommand : IRequest<Result>
{
    public string RefreshToken { get; init; } = string.Empty;
}
