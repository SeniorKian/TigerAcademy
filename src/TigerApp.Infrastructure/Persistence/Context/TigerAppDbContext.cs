using Microsoft.EntityFrameworkCore;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Infrastructure.Persistence.Context;

public class TigerAppDbContext : DbContext
{
    private readonly ICurrentUserService? _currentUserService;
    
    public TigerAppDbContext(DbContextOptions<TigerAppDbContext> options)
        : base(options)
    {
    }
    
    public TigerAppDbContext(DbContextOptions<TigerAppDbContext> options, ICurrentUserService currentUserService)
        : base(options)
    {
        _currentUserService = currentUserService;
    }
    
    // DbSets
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<Consultation> Consultations => Set<Consultation>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Content> Contents => Set<Content>();
    public DbSet<Faq> Faqs => Set<Faq>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Province> Provinces => Set<Province>();
    public DbSet<City> Cities => Set<City>();
    public DbSet<Quota> Quotas => Set<Quota>();
    public DbSet<FieldOfStudy> FieldsOfStudy => Set<FieldOfStudy>();
    public DbSet<InstallationState> InstallationStates => Set<InstallationState>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Apply all entity configurations
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TigerAppDbContext).Assembly);
    }
    
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }
        
        return await base.SaveChangesAsync(cancellationToken);
    }
}
