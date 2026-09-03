using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Features.Auth.DTOs;

namespace TigerApp.Application.Features.Auth.Commands.Register;

public record RegisterCommand : IRequest<Result<AuthResponse>>
{
    public string PhoneNumber { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string ConfirmPassword { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? Email { get; init; }
}
