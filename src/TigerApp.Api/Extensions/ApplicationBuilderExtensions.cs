using TigerApp.Api.Middleware;

namespace TigerApp.Api.Extensions;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseApiMiddleware(this IApplicationBuilder app)
    {
        // Exception handling
        app.UseMiddleware<ExceptionHandlingMiddleware>();

        // Installation is server-gated; client-side routing is not a security boundary.
        app.UseMiddleware<InstallationGateMiddleware>();
        
        // CORS
        app.UseCors("AllowReactApp");
        app.UseRateLimiter();
        
        // Authentication & Authorization
        app.UseAuthentication();
        app.UseAuthorization();
        
        return app;
    }
}
