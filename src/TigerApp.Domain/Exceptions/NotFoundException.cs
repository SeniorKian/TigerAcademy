namespace TigerApp.Domain.Exceptions;

public class NotFoundException : DomainException
{
    public NotFoundException(string name, object key)
        : base($"مورد \"{name}\" با شناسه \"{key}\" یافت نشد.")
    {
    }
    
    public NotFoundException(string name)
        : base($"مورد \"{name}\" یافت نشد.")
    {
    }
}
