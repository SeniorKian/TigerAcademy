using System.Text.Json;
using TigerApp.Api.Installation;

namespace TigerApp.Api.Middleware;

public sealed class InstallationGateMiddleware
{
    private readonly RequestDelegate _next;

    public InstallationGateMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(
        HttpContext context,
        IInstallationService installationService)
    {
        var path = context.Request.Path;
        var isApiRequest = path.StartsWithSegments("/api");
        var isInstallationApi = path.StartsWithSegments("/api/installation");
        var isHealthCheck = path.StartsWithSegments("/health");

        if (!isApiRequest || isInstallationApi || isHealthCheck || await installationService.IsInstalledAsync(context.RequestAborted))
        {
            await _next(context);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.Headers.RetryAfter = "60";
        await context.Response.WriteAsync(JsonSerializer.Serialize(new
        {
            success = false,
            code = "installation_required",
            message = "نصب اولیه سیستم هنوز کامل نشده است."
        }), context.RequestAborted);
    }
}
