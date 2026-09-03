namespace TigerApp.Domain.Entities;

public sealed class InstallationState : BaseEntity
{
    public string Key { get; set; } = "primary";
    public string InstallationId { get; set; } = string.Empty;
    public DateTime InstalledAtUtc { get; set; }
    public string SchemaVersion { get; set; } = string.Empty;
}
