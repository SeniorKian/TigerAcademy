using TigerApp.Domain.Enums;
namespace TigerApp.Domain.Entities;

public class User : BaseEntity
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PhoneNumber2 { get; set; }
    public string? Province { get; set; }
    public string? City { get; set; }
    public string? FieldOfStudy { get; set; }
    public string? Quota { get; set; } // سهمیه
    public DateTime? Birthday { get; set; }
    public string? TelegramId { get; set; }
    public UserRole Role { get; set; } = UserRole.User;
    public DateTime? LastLoginAt { get; set; }
    
    // Navigation properties
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
