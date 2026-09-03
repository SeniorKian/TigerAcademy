namespace TigerApp.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    // Repositories
    IUserRepository Users { get; }
    IRepository<Entities.Plan> Plans { get; }
    IRepository<Entities.Consultation> Consultations { get; }
    IRepository<Entities.Order> Orders { get; }
    IRepository<Entities.Payment> Payments { get; }
    IRepository<Entities.Content> Contents { get; }
    IRepository<Entities.Faq> Faqs { get; }
    IRepository<Entities.MenuItem> MenuItems { get; }
    IRepository<Entities.Province> Provinces { get; }
    IRepository<Entities.City> Cities { get; }
    IRepository<Entities.Quota> Quotas { get; }
    IRepository<Entities.FieldOfStudy> FieldsOfStudy { get; }
    IRepository<Entities.RefreshToken> RefreshTokens { get; }
    
    // Methods
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
