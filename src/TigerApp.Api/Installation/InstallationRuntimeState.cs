namespace TigerApp.Api.Installation;

public sealed class InstallationRuntimeState
{
    private int _installed;

    public bool IsInstalled => Volatile.Read(ref _installed) == 1;

    public void MarkInstalled() => Volatile.Write(ref _installed, 1);
}
