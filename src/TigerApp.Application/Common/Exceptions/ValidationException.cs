using FluentValidation.Results;

namespace TigerApp.Application.Common.Exceptions;

public class ValidationException : Exception
{
    public IDictionary<string, string[]> Errors { get; }
    
    public ValidationException() : base("خطا در اعتبارسنجی داده‌ها.")
    {
        Errors = new Dictionary<string, string[]>();
    }
    
    public ValidationException(IEnumerable<ValidationFailure> failures) : base("خطا در اعتبارسنجی داده‌ها.")
    {
        Errors = failures
            .GroupBy(e => e.PropertyName, e => e.ErrorMessage)
            .ToDictionary(g => g.Key, g => g.ToArray());
    }
}
