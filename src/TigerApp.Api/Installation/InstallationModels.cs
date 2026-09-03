namespace TigerApp.Api.Installation;

public sealed record InstallationStatus(
    bool Installed,
    bool? DatabaseReachable,
    string DatabaseProvider,
    string? Message);

public sealed class CompleteInstallationRequest
{
    public string SiteName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public sealed record InstallationCompletionResult(bool Completed, bool AlreadyInstalled, string Message);
