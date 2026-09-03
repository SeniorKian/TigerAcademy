using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TigerApp.Infrastructure.Persistence.Context;

public sealed class TigerAppDbContextFactory : IDesignTimeDbContextFactory<TigerAppDbContext>
{
    public TigerAppDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=tigerapp_migrations;Username=postgres;Password=postgres";

        var options = new DbContextOptionsBuilder<TigerAppDbContext>()
            .UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsAssembly(typeof(TigerAppDbContext).Assembly.FullName))
            .Options;

        return new TigerAppDbContext(options);
    }
}
