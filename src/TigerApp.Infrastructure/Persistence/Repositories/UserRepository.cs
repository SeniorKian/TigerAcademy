using Microsoft.EntityFrameworkCore;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Interfaces;
using TigerApp.Infrastructure.Persistence.Context;

namespace TigerApp.Infrastructure.Persistence.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(TigerAppDbContext context) : base(context)
    {
    }
    
    public override async Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(u => u.Orders)
            .FirstOrDefaultAsync(u => u.Id == id && u.IsActive, cancellationToken);
    }
    
    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.Email == email && u.IsActive, cancellationToken);
    }
    
    public async Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(u => u.Email == email && u.IsActive, cancellationToken);
    }
    
    public async Task<User?> GetByPhoneNumberAsync(string phoneNumber, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber && u.IsActive, cancellationToken);
    }
    
    public async Task<bool> PhoneNumberExistsAsync(string phoneNumber, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(u => u.PhoneNumber == phoneNumber && u.IsActive, cancellationToken);
    }
    
    public async Task<User?> GetByRefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.RefreshTokens.Any(rt => rt.Token == refreshToken && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow), cancellationToken);
    }
}
