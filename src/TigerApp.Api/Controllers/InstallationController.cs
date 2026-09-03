using System.Net.Mail;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TigerApp.Api.Installation;

namespace TigerApp.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/installation")]
public sealed partial class InstallationController : ControllerBase
{
    private const string InstallerHeader = "X-Tiger-Installer";
    private readonly IInstallationService _installationService;

    public InstallationController(IInstallationService installationService)
    {
        _installationService = installationService;
    }

    [HttpGet("status")]
    [EnableRateLimiting("installation-status")]
    public async Task<ActionResult<InstallationStatus>> Status(CancellationToken cancellationToken)
    {
        return Ok(await _installationService.GetStatusAsync(cancellationToken));
    }

    [HttpPost("test-database")]
    [EnableRateLimiting("installation")]
    public async Task<IActionResult> TestDatabase(CancellationToken cancellationToken)
    {
        if (!await CanUseWizardAsync(cancellationToken))
            return NotFound();

        var reachable = await _installationService.TestDatabaseAsync(cancellationToken);
        return reachable
            ? Ok(new { reachable = true, message = "اتصال امن به PostgreSQL برقرار شد." })
            : StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                reachable = false,
                message = "اتصال به PostgreSQL برقرار نشد. تنظیمات محرمانه سرور را بررسی کنید."
            });
    }

    [HttpPost("complete")]
    [EnableRateLimiting("installation")]
    public async Task<IActionResult> Complete(
        [FromBody] CompleteInstallationRequest request,
        CancellationToken cancellationToken)
    {
        if (!await CanUseWizardAsync(cancellationToken))
            return NotFound();

        var validationErrors = ValidateRequest(request);
        if (validationErrors.Count > 0)
            return BadRequest(new { message = "اطلاعات نصب کامل نیست.", errors = validationErrors });

        var result = await _installationService.CompleteAsync(request, cancellationToken);

        if (result.AlreadyInstalled)
            return NotFound();
        if (!result.Completed)
            return Conflict(new { message = result.Message });

        return Ok(new { installed = true, message = result.Message });
    }

    private async Task<bool> CanUseWizardAsync(CancellationToken cancellationToken)
    {
        if (!string.Equals(Request.Headers[InstallerHeader].FirstOrDefault(), "setup-wizard", StringComparison.Ordinal))
            return false;

        return !await _installationService.IsInstalledAsync(cancellationToken);
    }

    private static Dictionary<string, string[]> ValidateRequest(CompleteInstallationRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.SiteName) || request.SiteName.Trim().Length > 120)
            errors["siteName"] = ["نام سیستم الزامی است و حداکثر ۱۲۰ کاراکتر دارد."];
        if (string.IsNullOrWhiteSpace(request.FirstName) || request.FirstName.Trim().Length > 100)
            errors["firstName"] = ["نام مدیر الزامی است."];
        if (string.IsNullOrWhiteSpace(request.LastName) || request.LastName.Trim().Length > 100)
            errors["lastName"] = ["نام خانوادگی مدیر الزامی است."];
        if (!IranianMobileRegex().IsMatch(request.PhoneNumber?.Trim() ?? string.Empty))
            errors["phoneNumber"] = ["شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد."];
        if (!string.IsNullOrWhiteSpace(request.Email) && !MailAddress.TryCreate(request.Email.Trim(), out _))
            errors["email"] = ["ایمیل واردشده معتبر نیست."];
        if (request.Password is null || request.Password.Length < 12 || request.Password.Length > 128)
            errors["password"] = ["رمز عبور مدیر باید بین ۱۲ تا ۱۲۸ کاراکتر باشد."];
        if (!string.Equals(request.Password, request.ConfirmPassword, StringComparison.Ordinal))
            errors["confirmPassword"] = ["رمز عبور و تکرار آن یکسان نیستند."];
        return errors;
    }

    [GeneratedRegex("^09[0-9]{9}$", RegexOptions.CultureInvariant)]
    private static partial Regex IranianMobileRegex();
}
