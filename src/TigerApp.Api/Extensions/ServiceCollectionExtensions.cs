using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.DataProtection;
using System.Threading.RateLimiting;
using TigerApp.Api.Installation;
using TigerApp.Application;
using TigerApp.Infrastructure;

namespace TigerApp.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        var jwtSecret = configuration["JwtSettings:Secret"];
        if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
            throw new InvalidOperationException("JwtSettings:Secret must be configured with at least 32 characters.");

        // Application
        services.AddApplication();
        
        // Infrastructure
        services.AddInfrastructure(configuration);
        
        // Authentication
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtSecret)),
                    ValidateIssuer = true,
                    ValidIssuer = configuration["JwtSettings:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = configuration["JwtSettings:Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };
            });
        
        services.AddAuthorization();
        services.AddHttpClient();
        var keyDirectory = new DirectoryInfo(Path.Combine(environment.ContentRootPath, "App_Data", "keys"));
        services.AddDataProtection()
            .SetApplicationName("TigerApp")
            .PersistKeysToFileSystem(keyDirectory);
        services.Configure<InstallationOptions>(configuration.GetSection(InstallationOptions.SectionName));
        services.AddSingleton<InstallationRuntimeState>();
        services.AddScoped<IInstallationService, InstallationService>();
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy("installation-status", context => RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 30,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    AutoReplenishment = true
                }));
            options.AddPolicy("installation", context => RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    AutoReplenishment = true
                }));
        });
        
        // Controllers with case-insensitive JSON
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
            });
        
        // CORS is restricted to explicitly configured development/admin origins.
        services.AddCors(options =>
        {
            options.AddPolicy("AllowReactApp", builder =>
            {
                var origins = (configuration["Cors:Origins"] ?? string.Empty)
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                if (origins.Length > 0)
                    builder.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
            });
        });
        
        // Swagger
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "TigerApp API",
                Version = "v1",
                Description = "API سیستم مشاوره انتخاب رشته TigerApp"
            });
            
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header. Example: \"Bearer {token}\"",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer"
            });
            
            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });
        
        // Health checks
        services.AddHealthChecks();
        
        return services;
    }
}
