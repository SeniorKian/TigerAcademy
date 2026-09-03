namespace TigerApp.Application.Features.Users.DTOs;

public class UserProfileDto
{
    public int Id { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Province { get; set; }
    public string? City { get; set; }
    public string? Quota { get; set; }
    public string? FieldOfStudy { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? BirthDateShamsi { get; set; }
    public string? TelegramId { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedAtShamsi { get; set; }
    public string Role { get; set; } = "User";
    public string RoleName { get; set; } = "کاربر";
}
