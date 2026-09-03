namespace TigerApp.Api.Installation;

public interface IInstallationService
{
    Task<bool> IsInstalledAsync(CancellationToken cancellationToken = default);
    Task<InstallationStatus> GetStatusAsync(CancellationToken cancellationToken = default);
    Task<bool> TestDatabaseAsync(CancellationToken cancellationToken = default);
    Task<InstallationCompletionResult> CompleteAsync(
        CompleteInstallationRequest request,
        CancellationToken cancellationToken = default);
}
