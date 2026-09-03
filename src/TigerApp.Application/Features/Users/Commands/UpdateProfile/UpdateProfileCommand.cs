using TigerApp.Application.Common.Models;
using MediatR;
using TigerApp.Application.Features.Users.DTOs;

namespace TigerApp.Application.Features.Users.Commands.UpdateProfile;

public class UpdateProfileCommand : IRequest<Result<UserProfileDto>>
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Province { get; set; }
    public string? City { get; set; }
    public string? Quota { get; set; }
    public string? FieldOfStudy { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? BirthDateShamsi { get; set; }
    public bool ClearBirthDate { get; set; }
    public string? TelegramId { get; set; }
}
