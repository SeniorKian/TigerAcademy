using TigerApp.Application.Common.Models;
namespace TigerApp.Application.Common.Models;

public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public string? Message { get; private set; }
    public T? Data { get; private set; }
    public List<string> Errors { get; private set; } = new();
    
    public static Result<T> Success(T data, string? message = null)
    {
        return new Result<T>
        {
            IsSuccess = true,
            Data = data,
            Message = message
        };
    }
    
    public static Result<T> Success(string? message = null)
    {
        return new Result<T>
        {
            IsSuccess = true,
            Message = message
        };
    }
    
    public static Result<T> Failure(string error)
    {
        return new Result<T>
        {
            IsSuccess = false,
            Errors = new List<string> { error }
        };
    }
    
    public static Result<T> Failure(List<string> errors)
    {
        return new Result<T>
        {
            IsSuccess = false,
            Errors = errors
        };
    }
}

public class Result
{
    public bool IsSuccess { get; private set; }
    public string? Message { get; private set; }
    public List<string> Errors { get; private set; } = new();
    
    public static Result Success(string? message = null)
    {
        return new Result
        {
            IsSuccess = true,
            Message = message
        };
    }
    
    public static Result Failure(string error)
    {
        return new Result
        {
            IsSuccess = false,
            Errors = new List<string> { error }
        };
    }
    
    public static Result Failure(List<string> errors)
    {
        return new Result
        {
            IsSuccess = false,
            Errors = errors
        };
    }
}
