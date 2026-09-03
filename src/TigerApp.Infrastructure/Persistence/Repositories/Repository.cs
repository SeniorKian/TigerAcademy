using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Interfaces;
using TigerApp.Infrastructure.Persistence.Context;

namespace TigerApp.Infrastructure.Persistence.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly TigerAppDbContext _context;
    protected readonly DbSet<T> _dbSet;
    
    public Repository(TigerAppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }
    
    public virtual async Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FindAsync(new object[] { id }, cancellationToken);
    }
    
    public virtual async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(e => e.IsActive)
            .ToListAsync(cancellationToken);
    }

    public virtual async Task<IReadOnlyList<T>> GetAllIncludingInactiveAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet.AsNoTracking().ToListAsync(cancellationToken);
    }
    
    public virtual async Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(predicate)
            .ToListAsync(cancellationToken);
    }
    
    public virtual async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await _dbSet.AddAsync(entity, cancellationToken);
        return entity;
    }
    
    public virtual Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        _dbSet.Update(entity);
        return Task.CompletedTask;
    }
    
    public virtual Task DeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        entity.IsActive = false;
        _dbSet.Update(entity);
        return Task.CompletedTask;
    }

    // Explicit opt-in: existing DeleteAsync callers keep their soft-delete behavior.
    public virtual Task PermanentlyDeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _dbSet.Remove(entity);
        return Task.CompletedTask;
    }
    
    public virtual async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default)
    {
        if (predicate == null)
            return await _dbSet.CountAsync(e => e.IsActive, cancellationToken);
        
        return await _dbSet.CountAsync(predicate, cancellationToken);
    }
    
    public virtual async Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(predicate, cancellationToken);
    }
}
