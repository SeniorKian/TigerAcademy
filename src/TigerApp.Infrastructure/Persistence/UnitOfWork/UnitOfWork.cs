using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Interfaces;
using TigerApp.Infrastructure.Persistence.Context;
using TigerApp.Infrastructure.Persistence.Repositories;

namespace TigerApp.Infrastructure.Persistence.UnitOfWork;

public class UnitOfWork : IUnitOfWork
{
    private readonly TigerAppDbContext _context;
    private IDbContextTransaction? _transaction;
    
    private IUserRepository? _users;
    private IRepository<Plan>? _plans;
    private IRepository<Consultation>? _consultations;
    private IRepository<Order>? _orders;
    private IRepository<Payment>? _payments;
    private IRepository<Content>? _contents;
    private IRepository<Faq>? _faqs;
    private IRepository<MenuItem>? _menuItems;
    private IRepository<Province>? _provinces;
    private IRepository<City>? _cities;
    private IRepository<Quota>? _quotas;
    private IRepository<FieldOfStudy>? _fieldsOfStudy;
    private IRepository<RefreshToken>? _refreshTokens;
    
    public UnitOfWork(TigerAppDbContext context)
    {
        _context = context;
    }
    
    public IUserRepository Users => _users ??= new UserRepository(_context);
    public IRepository<Plan> Plans => _plans ??= new Repository<Plan>(_context);
    public IRepository<Consultation> Consultations => _consultations ??= new Repository<Consultation>(_context);
    public IRepository<Order> Orders => _orders ??= new Repository<Order>(_context);
    public IRepository<Payment> Payments => _payments ??= new Repository<Payment>(_context);
    public IRepository<Content> Contents => _contents ??= new Repository<Content>(_context);
    public IRepository<Faq> Faqs => _faqs ??= new Repository<Faq>(_context);
    public IRepository<MenuItem> MenuItems => _menuItems ??= new Repository<MenuItem>(_context);
    public IRepository<Province> Provinces => _provinces ??= new Repository<Province>(_context);
    public IRepository<City> Cities => _cities ??= new Repository<City>(_context);
    public IRepository<Quota> Quotas => _quotas ??= new Repository<Quota>(_context);
    public IRepository<FieldOfStudy> FieldsOfStudy => _fieldsOfStudy ??= new Repository<FieldOfStudy>(_context);
    public IRepository<RefreshToken> RefreshTokens => _refreshTokens ??= new Repository<RefreshToken>(_context);
    
    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
    
    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }
    
    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }
    
    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }
    
    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
