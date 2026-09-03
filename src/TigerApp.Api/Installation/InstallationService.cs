using System.Data;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Enums;
using TigerApp.Domain.Interfaces;
using TigerApp.Infrastructure.Persistence;
using TigerApp.Infrastructure.Persistence.Context;

namespace TigerApp.Api.Installation;

public sealed class InstallationService : IInstallationService
{
    private const string StateKey = "primary";
    private const long AdvisoryLockKey = 781_947_231;
    private static readonly SemaphoreSlim ProcessLock = new(1, 1);

    private readonly TigerAppDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly InstallationOptions _options;
    private readonly InstallationRuntimeState _runtimeState;
    private readonly ILogger<InstallationService> _logger;
    private readonly string _lockFilePath;

    public InstallationService(
        TigerAppDbContext dbContext,
        IPasswordHasher passwordHasher,
        IOptions<InstallationOptions> options,
        InstallationRuntimeState runtimeState,
        IWebHostEnvironment environment,
        ILogger<InstallationService> logger)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _options = options.Value;
        _runtimeState = runtimeState;
        _logger = logger;
        _lockFilePath = ResolveLockFile(environment.ContentRootPath, _options.LockFile);
    }

    public async Task<bool> IsInstalledAsync(CancellationToken cancellationToken = default)
    {
        if (_runtimeState.IsInstalled || File.Exists(_lockFilePath))
        {
            _runtimeState.MarkInstalled();
            return true;
        }

        try
        {
            if (!await _dbContext.Database.CanConnectAsync(cancellationToken))
                return false;

            var appliedMigrations = await _dbContext.Database.GetAppliedMigrationsAsync(cancellationToken);
            if (!appliedMigrations.Any())
                return false;

            var installed = await _dbContext.InstallationStates
                .AsNoTracking()
                .AnyAsync(x => x.Key == StateKey, cancellationToken);

            if (!installed)
                return false;

            _runtimeState.MarkInstalled();
            await TryWriteLockFileAsync("database-marker", cancellationToken);
            return true;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Installation state could not be read from PostgreSQL.");
            return false;
        }
    }

    public async Task<InstallationStatus> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        var stateProbeTimedOut = false;
        bool installed;
        using (var stateProbe = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken))
        {
            stateProbe.CancelAfter(TimeSpan.FromSeconds(3));
            try
            {
                installed = await IsInstalledAsync(stateProbe.Token);
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                installed = false;
                stateProbeTimedOut = true;
            }
        }
        if (installed)
            return new InstallationStatus(true, null, "PostgreSQL", null);

        var reachable = false;
        if (!stateProbeTimedOut)
        {
            using var probeTimeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            probeTimeout.CancelAfter(TimeSpan.FromSeconds(3));
            try { reachable = await TestDatabaseAsync(probeTimeout.Token); }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                reachable = false;
            }
        }
        return new InstallationStatus(false, reachable, "PostgreSQL", null);
    }

    public async Task<bool> TestDatabaseAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _dbContext.Database.CanConnectAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            return false;
        }
    }

    public async Task<InstallationCompletionResult> CompleteAsync(
        CompleteInstallationRequest request,
        CancellationToken cancellationToken = default)
    {
        await ProcessLock.WaitAsync(cancellationToken);
        try
        {
            if (await IsInstalledAsync(cancellationToken))
                return new InstallationCompletionResult(false, true, "سیستم قبلاً نصب شده است.");

            if (!await TestDatabaseAsync(cancellationToken))
                return new InstallationCompletionResult(false, false, "اتصال امن به PostgreSQL برقرار نشد.");

            await _dbContext.Database.MigrateAsync(cancellationToken);

            await using var transaction = await _dbContext.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            await _dbContext.Database.ExecuteSqlRawAsync(
                $"SELECT pg_advisory_xact_lock({AdvisoryLockKey})",
                cancellationToken);

            if (await _dbContext.InstallationStates.AnyAsync(x => x.Key == StateKey, cancellationToken))
            {
                await transaction.RollbackAsync(cancellationToken);
                _runtimeState.MarkInstalled();
                await TryWriteLockFileAsync("database-marker", cancellationToken);
                return new InstallationCompletionResult(false, true, "سیستم قبلاً نصب شده است.");
            }

            if (await _dbContext.Users.AnyAsync(cancellationToken))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new InstallationCompletionResult(false, false, "پایگاه داده خالی نیست؛ نصب برای جلوگیری از تصاحب حساب متوقف شد.");
            }

            await SeedData.SeedAsync(_dbContext);
            await LookupSeedData.EnsureCompleteAsync(_dbContext, cancellationToken);

            var now = DateTime.UtcNow;
            await _dbContext.Users.AddAsync(new User
            {
                PhoneNumber = request.PhoneNumber.Trim(),
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim().ToLowerInvariant(),
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                Role = UserRole.Admin,
                CreatedAt = now
            }, cancellationToken);

            await _dbContext.Contents.AddAsync(new Content
            {
                Key = "system.siteName",
                Value = request.SiteName.Trim(),
                Type = ContentType.Text,
                Page = "system",
                Section = "settings",
                Language = "fa",
                Order = 0,
                IsActive = true,
                CreatedAt = now
            }, cancellationToken);

            var schemaVersion = (await _dbContext.Database.GetAppliedMigrationsAsync(cancellationToken)).LastOrDefault()
                ?? "unknown";
            var installationId = Guid.NewGuid().ToString("N");
            await _dbContext.InstallationStates.AddAsync(new InstallationState
            {
                Key = StateKey,
                InstallationId = installationId,
                InstalledAtUtc = now,
                SchemaVersion = schemaVersion,
                IsActive = true,
                CreatedAt = now
            }, cancellationToken);

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _runtimeState.MarkInstalled();
            await TryWriteLockFileAsync(installationId, cancellationToken);

            return new InstallationCompletionResult(true, false, "نصب با موفقیت کامل شد.");
        }
        finally
        {
            ProcessLock.Release();
        }
    }

    private static string ResolveLockFile(string contentRoot, string configuredPath)
    {
        var root = Path.GetFullPath(contentRoot);
        var candidate = Path.GetFullPath(Path.Combine(root, configuredPath));
        var relative = Path.GetRelativePath(root, candidate);
        if (relative.StartsWith("..", StringComparison.Ordinal) || Path.IsPathRooted(relative))
            throw new InvalidOperationException("Installation:LockFile must remain inside the application content root.");

        return candidate;
    }

    private async Task TryWriteLockFileAsync(string installationId, CancellationToken cancellationToken)
    {
        try
        {
            var directory = Path.GetDirectoryName(_lockFilePath)
                ?? throw new InvalidOperationException("Installation lock directory is invalid.");
            Directory.CreateDirectory(directory);
            var temporaryPath = $"{_lockFilePath}.{Guid.NewGuid():N}.tmp";
            await File.WriteAllTextAsync(
                temporaryPath,
                $"TigerApp installation lock{Environment.NewLine}{installationId}{Environment.NewLine}{DateTime.UtcNow:O}",
                Encoding.UTF8,
                cancellationToken);
            File.Move(temporaryPath, _lockFilePath, true);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "The installation database marker exists, but the local lock file could not be written.");
        }
    }
}
