namespace TigerApp.Api.Installation;

public sealed class InstallationOptions
{
    public const string SectionName = "Installation";

    public string LockFile { get; set; } = "App_Data/installed.lock";
}
