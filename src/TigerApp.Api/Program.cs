using Serilog;
using TigerApp.Api.Configuration;
using TigerApp.Api.Extensions;

DotEnvLoader.LoadClosest(Directory.GetCurrentDirectory());
var builder = WebApplication.CreateBuilder(args);

// Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/tigerapp-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

try
{
    Log.Information("Starting TigerApp API...");
    
    // Add services
    builder.Services.AddApiServices(builder.Configuration, builder.Environment);
    
    var app = builder.Build();
    
    // Swagger (only in development)
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "TigerApp API v1");
        });
    }
    
    // Middleware pipeline
    app.UseApiMiddleware();
    
    // Serve React SPA - Static files from wwwroot
    app.UseDefaultFiles();           // serves index.html as default
    app.UseStaticFiles();            // serves CSS, JS, images from wwwroot
    
    // API Controllers
    app.MapControllers();
    app.MapHealthChecks("/health");
    
    // SPA fallback - all non-API routes serve index.html for client-side routing
    app.MapFallbackToFile("index.html");
    
    Log.Information("TigerApp started. Use the configured ASPNETCORE_URLS endpoint.");
    
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
