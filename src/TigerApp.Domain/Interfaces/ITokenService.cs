using TigerApp.Domain.Entities;

namespace TigerApp.Domain.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    DateTime GetTokenExpiration(string token);
    bool ValidateToken(string token);
}
