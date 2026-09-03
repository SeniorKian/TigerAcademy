using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TigerApp.Domain.Enums;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    public SettingsController(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublic(CancellationToken cancellationToken)
    {
        var values = await GetValues(cancellationToken);
        return Ok(new
        {
            SiteName = Get(values, "system.siteName", "تایگر آکادمی"),
            SiteSubtitle = Get(values, "system.siteSubtitle", "انتخاب آگاهانه، آینده روشن"),
            SupportPhone = Get(values, "system.supportPhone", "09124054575"),
            FooterText = Get(values, "system.footerText", "طراحی شده برای انتخاب‌های روشن‌تر"),
            RegistrationEnabled = GetBool(values, "system.registrationEnabled", true),
            MaintenanceMode = GetBool(values, "system.maintenanceMode", false),
            OnlinePaymentEnabled = GetBool(values, "payment.online.enabled", false),
            CardToCardEnabled = GetBool(values, "payment.card.enabled", false),
            CardNumber = Get(values, "payment.card.number", ""),
            CardHolder = Get(values, "payment.card.holder", "")
        });
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var values = await GetValues(cancellationToken);
        return Ok(new SystemSettingsDto
        {
            SiteName = Get(values, "system.siteName", "تایگر آکادمی"),
            SiteSubtitle = Get(values, "system.siteSubtitle", "انتخاب آگاهانه، آینده روشن"),
            SupportPhone = Get(values, "system.supportPhone", "09124054575"),
            SupportEmail = Get(values, "system.supportEmail", ""),
            FooterText = Get(values, "system.footerText", "طراحی شده برای انتخاب‌های روشن‌تر"),
            DefaultLanguage = Get(values, "system.defaultLanguage", "fa"),
            RegistrationEnabled = GetBool(values, "system.registrationEnabled", true),
            MaintenanceMode = GetBool(values, "system.maintenanceMode", false),
            OnlinePaymentEnabled = GetBool(values, "payment.online.enabled", false),
            ZarinpalMerchantId = Get(values, "payment.zarinpal.merchantId", ""),
            ZarinpalSandbox = GetBool(values, "payment.zarinpal.sandbox", true),
            PaymentCallbackUrl = Get(values, "payment.callbackUrl", "/api/payments/zarinpal/callback"),
            CardToCardEnabled = GetBool(values, "payment.card.enabled", false),
            CardNumber = Get(values, "payment.card.number", ""),
            CardHolder = Get(values, "payment.card.holder", "")
        });
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update([FromBody] SystemSettingsDto request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.SiteName)) return BadRequest(new { message = "نام سیستم الزامی است" });
        if (request.OnlinePaymentEnabled && string.IsNullOrWhiteSpace(request.ZarinpalMerchantId))
            return BadRequest(new { message = "برای فعال‌سازی پرداخت آنلاین، Merchant ID زرین‌پال الزامی است" });
        if (request.OnlinePaymentEnabled && !Guid.TryParse(request.ZarinpalMerchantId, out _))
            return BadRequest(new { message = "Merchant ID زرین‌پال باید یک UUID معتبر ۳۶ کاراکتری باشد" });
        if (request.CardToCardEnabled && string.IsNullOrWhiteSpace(request.CardNumber))
            return BadRequest(new { message = "برای کارت‌به‌کارت، شماره کارت الزامی است" });

        var all = await _unitOfWork.Contents.GetAllIncludingInactiveAsync(cancellationToken);
        var settings = all.Where(x => x.Page == "system" && x.Section == "settings").ToDictionary(x => x.Key);
        var updates = new Dictionary<string, string>
        {
            ["system.siteName"] = request.SiteName.Trim(),
            ["system.siteSubtitle"] = request.SiteSubtitle?.Trim() ?? "",
            ["system.supportPhone"] = request.SupportPhone?.Trim() ?? "",
            ["system.supportEmail"] = request.SupportEmail?.Trim() ?? "",
            ["system.footerText"] = request.FooterText?.Trim() ?? "",
            ["system.defaultLanguage"] = request.DefaultLanguage == "en" ? "en" : "fa",
            ["system.registrationEnabled"] = request.RegistrationEnabled.ToString(),
            ["system.maintenanceMode"] = request.MaintenanceMode.ToString(),
            ["payment.online.enabled"] = request.OnlinePaymentEnabled.ToString(),
            ["payment.zarinpal.merchantId"] = request.ZarinpalMerchantId?.Trim() ?? "",
            ["payment.zarinpal.sandbox"] = request.ZarinpalSandbox.ToString(),
            ["payment.callbackUrl"] = request.PaymentCallbackUrl?.Trim() ?? "/api/payments/zarinpal/callback",
            ["payment.card.enabled"] = request.CardToCardEnabled.ToString(),
            ["payment.card.number"] = request.CardNumber?.Trim() ?? "",
            ["payment.card.holder"] = request.CardHolder?.Trim() ?? ""
        };

        var order = 0;
        foreach (var pair in updates)
        {
            if (settings.TryGetValue(pair.Key, out var entity))
            {
                entity.Value = pair.Value;
                entity.IsActive = true;
                entity.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.Contents.UpdateAsync(entity, cancellationToken);
            }
            else
            {
                await _unitOfWork.Contents.AddAsync(new Domain.Entities.Content
                {
                    Key = pair.Key, Value = pair.Value, Type = ContentType.Text, Page = "system",
                    Section = "settings", Language = "fa", Order = order++, IsActive = true, CreatedAt = DateTime.UtcNow
                }, cancellationToken);
            }
        }
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "تنظیمات سیستم ذخیره شد" });
    }

    private async Task<Dictionary<string, string>> GetValues(CancellationToken cancellationToken)
    {
        var all = await _unitOfWork.Contents.FindAsync(x => x.Page == "system" && x.Section == "settings" && x.IsActive, cancellationToken);
        return all.GroupBy(x => x.Key).ToDictionary(group => group.Key, group => group.OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).First().Value);
    }
    private static string Get(IReadOnlyDictionary<string, string> values, string key, string fallback) => values.TryGetValue(key, out var value) ? value : fallback;
    private static bool GetBool(IReadOnlyDictionary<string, string> values, string key, bool fallback) => values.TryGetValue(key, out var value) && bool.TryParse(value, out var parsed) ? parsed : fallback;
}

public sealed class SystemSettingsDto
{
    public string SiteName { get; set; } = "تایگر آکادمی";
    public string? SiteSubtitle { get; set; }
    public string? SupportPhone { get; set; }
    public string? SupportEmail { get; set; }
    public string? FooterText { get; set; }
    public string DefaultLanguage { get; set; } = "fa";
    public bool RegistrationEnabled { get; set; } = true;
    public bool MaintenanceMode { get; set; }
    public bool OnlinePaymentEnabled { get; set; }
    public string? ZarinpalMerchantId { get; set; }
    public bool ZarinpalSandbox { get; set; } = true;
    public string? PaymentCallbackUrl { get; set; }
    public bool CardToCardEnabled { get; set; }
    public string? CardNumber { get; set; }
    public string? CardHolder { get; set; }
}
