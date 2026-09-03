using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Features.Auth.DTOs;

namespace TigerApp.Application.Features.Auth.Commands.RefreshTokenCmd;

public record RefreshTokenCommand : IRequest<Result<AuthResponse>>
{
    public string RefreshToken { get; init; } = string.Empty;
}
