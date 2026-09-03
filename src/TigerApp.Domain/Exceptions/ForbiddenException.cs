namespace TigerApp.Domain.Exceptions;

public class ForbiddenException : DomainException
{
    public ForbiddenException()
        : base("شما اجازه دسترسی به این بخش را ندارید.")
    {
    }
    
    public ForbiddenException(string message)
        : base(message)
    {
    }
}
