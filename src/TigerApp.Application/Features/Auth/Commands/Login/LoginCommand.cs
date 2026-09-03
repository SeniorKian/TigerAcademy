using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Features.Auth.DTOs;

namespace TigerApp.Application.Features.Auth.Commands.Login;

public record LoginCommand : IRequest<Result<AuthResponse>>
{
    public string PhoneNumber { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
}
