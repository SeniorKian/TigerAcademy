using System.Net;
using System.Text.Json;
using TigerApp.Application.Common.Exceptions;
using TigerApp.Domain.Exceptions;

namespace TigerApp.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    
    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }
    
    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";
        
        HttpStatusCode statusCode;
        object message;
        
        switch (exception)
        {
            case ValidationException ex:
                statusCode = HttpStatusCode.BadRequest;
                message = ex.Errors;
                break;
            case NotFoundException ex:
                statusCode = HttpStatusCode.NotFound;
                message = ex.Message;
                break;
            case ForbiddenException ex:
                statusCode = HttpStatusCode.Forbidden;
                message = ex.Message;
                break;
            case DomainException ex:
                statusCode = HttpStatusCode.BadRequest;
                message = ex.Message;
                break;
            default:
                statusCode = HttpStatusCode.InternalServerError;
                message = "خطای داخلی سرور رخ داده است.";
                break;
        }
        
        response.StatusCode = (int)statusCode;
        
        _logger.LogError(exception, "خطا رخ داد: {Message}", exception.Message);
        
        var result = new
        {
            success = false,
            message = message is string msg ? msg : null,
            errors = message is Dictionary<string, string[]> errors ? errors : null
        };
        
        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
        
        await response.WriteAsync(JsonSerializer.Serialize(result, jsonOptions));
    }
}
