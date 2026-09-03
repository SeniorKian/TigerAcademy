namespace TigerApp.Domain.Enums;

public enum OrderStatus
{
    Pending = 0,
    Processing = 1,
    Paid = 2,
    Completed = 3,
    Failed = 4,
    Cancelled = 5,
    Refunded = 6,
    Expired = 7
}
