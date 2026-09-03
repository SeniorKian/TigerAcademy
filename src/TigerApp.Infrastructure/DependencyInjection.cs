using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TigerApp.Domain.Interfaces;
using TigerApp.Infrastructure.Authentication;
using TigerApp.Infrastructure.Persistence.Context;
using TigerApp.Infrastructure.Persistence.Repositories;
using TigerApp.Infrastructure.Persistence.UnitOfWork;
using TigerApp.Infrastructure.Services;

namespace TigerApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("ConnectionStrings:DefaultConnection must be configured for PostgreSQL.");

        services.AddDbContext<TigerAppDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsAssembly(typeof(TigerAppDbContext).Assembly.FullName)));
        
        // Repositories
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        
        // Authentication
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        
        // Services
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddHttpContextAccessor();
        
        return services;
    }
}
