using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TigerApp.Application.Common.Helpers;
using TigerApp.Domain.Entities;
using TigerApp.Domain.Enums;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class PaymentsController : ControllerBase
{
    private static readonly Dictionary<string, byte[][]> ReceiptSignatures = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = [[0xFF, 0xD8, 0xFF]],
        [".jpeg"] = [[0xFF, 0xD8, 0xFF]],
        [".png"] = [[0x89, 0x50, 0x4E, 0x47]],
        [".webp"] = [[0x52, 0x49, 0x46, 0x46]],
        [".pdf"] = [[0x25, 0x50, 0x44, 0x46]]
    };
    private const long MaxReceiptSize = 6 * 1024 * 1024;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IWebHostEnvironment _environment;

    public PaymentsController(IUnitOfWork unitOfWork, IHttpClientFactory httpClientFactory, IWebHostEnvironment environment)
    {
        _unitOfWork = unitOfWork;
        _httpClientFactory = httpClientFactory;
        _environment = environment;
    }

    [Authorize]
    [HttpPost("card-receipt/{orderId:int}")]
    [RequestSizeLimit(MaxReceiptSize + 1024 * 1024)]
    public async Task<IActionResult> SubmitCardReceipt(
        int orderId,
        [FromForm] IFormFile receipt,
        [FromForm] string? bankReference,
        [FromForm] string? cardLastFour,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var order = await _unitOfWork.Orders.GetByIdAsync(orderId, cancellationToken);
        if (order is null || order.UserId != userId) return NotFound(new { message = "سفارش یافت نشد" });
        if (order.Status is OrderStatus.Paid or OrderStatus.Completed or OrderStatus.Refunded)
            return BadRequest(new { message = "این سفارش قبلاً پرداخت شده است" });

        var settings = await GetSettings(cancellationToken);
        if (!GetBool(settings, "payment.card.enabled"))
            return BadRequest(new { message = "پرداخت کارت‌به‌کارت فعال نیست" });

        var validationError = await ValidateReceipt(receipt, cancellationToken);
        if (validationError is not null) return BadRequest(new { message = validationError });
        if (!string.IsNullOrWhiteSpace(cardLastFour) && (cardLastFour.Length != 4 || !cardLastFour.All(char.IsDigit)))
            return BadRequest(new { message = "چهار رقم آخر کارت باید دقیقاً ۴ رقم باشد" });

        var extension = Path.GetExtension(receipt.FileName).ToLowerInvariant();
        var relativeDirectory = Path.Combine("uploads", "receipts", DateTime.UtcNow.ToString("yyyy-MM"));
        var physicalDirectory = Path.Combine(_environment.WebRootPath, relativeDirectory);
        Directory.CreateDirectory(physicalDirectory);
        var storedName = $"{Guid.NewGuid():N}{extension}";
        var physicalPath = Path.Combine(physicalDirectory, storedName);
        await using (var stream = System.IO.File.Create(physicalPath))
            await receipt.CopyToAsync(stream, cancellationToken);

        var receiptUrl = "/" + Path.Combine(relativeDirectory, storedName).Replace('\\', '/');
        var payments = await _unitOfWork.Payments.FindAsync(x => x.OrderId == order.Id, cancellationToken);
        var payment = payments.OrderByDescending(x => x.Id).FirstOrDefault();
        var oldReceiptUrl = payment?.Gateway == "CardToCard" ? payment.ReferenceId : null;
        var metadata = JsonSerializer.Serialize(new
        {
            receiptUrl,
            originalFileName = Path.GetFileName(receipt.FileName),
            receipt.ContentType,
            receipt.Length,
            submittedAt = DateTime.UtcNow,
            note = "رسید توسط کاربر ارسال شده و منتظر بررسی مدیر است"
        });

        if (payment is null)
        {
            payment = new Payment
            {
                OrderId = order.Id,
                Amount = order.Amount,
                Gateway = "CardToCard",
                Status = PaymentStatus.Processing,
                ReferenceId = receiptUrl,
                BankReference = string.IsNullOrWhiteSpace(bankReference) ? null : bankReference.Trim(),
                CardNumber = string.IsNullOrWhiteSpace(cardLastFour) ? null : cardLastFour,
                ResponseJson = metadata
            };
            await _unitOfWork.Payments.AddAsync(payment, cancellationToken);
        }
        else
        {
            payment.Amount = order.Amount;
            payment.Gateway = "CardToCard";
            payment.Status = PaymentStatus.Processing;
            payment.ReferenceId = receiptUrl;
            payment.BankReference = string.IsNullOrWhiteSpace(bankReference) ? null : bankReference.Trim();
            payment.CardNumber = string.IsNullOrWhiteSpace(cardLastFour) ? null : cardLastFour;
            payment.ResponseJson = metadata;
            payment.PaidAt = null;
            await _unitOfWork.Payments.UpdateAsync(payment, cancellationToken);
        }

        order.Status = OrderStatus.Processing;
        order.PaymentGateway = "CardToCard";
        order.PaymentReference = receiptUrl;
        await _unitOfWork.Orders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        DeletePreviousReceipt(oldReceiptUrl, receiptUrl);

        return Ok(new { message = "رسید با موفقیت ثبت شد و در صف بررسی قرار گرفت", receiptUrl, status = payment.Status });
    }

    [Authorize(Roles = "Admin,Consultant")]
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] PaymentStatus? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 10, 100);
        var payments = await _unitOfWork.Payments.GetAllIncludingInactiveAsync(cancellationToken);
        var orders = await _unitOfWork.Orders.GetAllIncludingInactiveAsync(cancellationToken);
        var users = await _unitOfWork.Users.GetAllIncludingInactiveAsync(cancellationToken);
        var orderLookup = orders.ToDictionary(x => x.Id);
        var userLookup = users.ToDictionary(x => x.Id);
        var query = payments.OrderByDescending(x => x.CreatedAt).AsEnumerable();
        if (status.HasValue) query = query.Where(x => x.Status == status.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(payment =>
            {
                if (!orderLookup.TryGetValue(payment.OrderId, out var order)) return false;
                userLookup.TryGetValue(order.UserId, out var user);
                return (order.TrackingCode?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
                    || (payment.BankReference?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
                    || (user?.PhoneNumber.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
                    || ($"{user?.FirstName} {user?.LastName}".Contains(term, StringComparison.OrdinalIgnoreCase));
            });
        }

        var filtered = query.ToList();
        var items = filtered.Skip((page - 1) * pageSize).Take(pageSize).Select(payment =>
        {
            orderLookup.TryGetValue(payment.OrderId, out var order);
            User? user = null;
            if (order is not null) userLookup.TryGetValue(order.UserId, out user);
            return new
            {
                payment.Id,
                payment.OrderId,
                TrackingCode = order?.TrackingCode,
                UserName = $"{user?.FirstName} {user?.LastName}".Trim(),
                UserPhone = user?.PhoneNumber,
                payment.Amount,
                payment.Status,
                StatusName = PaymentStatusName(payment.Status),
                payment.Gateway,
                ReceiptUrl = payment.Gateway == "CardToCard" ? payment.ReferenceId : null,
                payment.BankReference,
                CardLastFour = payment.CardNumber,
                payment.PaidAt,
                PaidAtShamsi = payment.PaidAt?.ToPersianDateTime(),
                payment.CreatedAt,
                CreatedAtShamsi = payment.CreatedAt.ToPersianDateTime(),
                OrderNotes = order?.Notes
            };
        });
        return Ok(new { items, page, pageSize, totalCount = filtered.Count, totalPages = (int)Math.Ceiling(filtered.Count / (double)pageSize) });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{paymentId:int}/review")]
    public async Task<IActionResult> ReviewCardReceipt(int paymentId, [FromBody] ReviewReceiptRequest request, CancellationToken cancellationToken)
    {
        var payment = await _unitOfWork.Payments.GetByIdAsync(paymentId, cancellationToken);
        if (payment is null || payment.Gateway != "CardToCard") return NotFound(new { message = "رسید یافت نشد" });
        if (payment.Status != PaymentStatus.Processing)
            return BadRequest(new { message = "فقط رسید در حال بررسی قابل تأیید یا رد است" });
        var order = await _unitOfWork.Orders.GetByIdAsync(payment.OrderId, cancellationToken);
        if (order is null) return NotFound(new { message = "سفارش مرتبط یافت نشد" });

        if (request.Approved)
        {
            var paidAt = DateTime.UtcNow;
            payment.Status = PaymentStatus.Successful;
            payment.PaidAt = paidAt;
            order.Status = OrderStatus.Paid;
            order.PaidAt = paidAt;
            order.PaymentReference = payment.BankReference ?? $"CARD-{payment.Id}";
        }
        else
        {
            payment.Status = PaymentStatus.Failed;
            payment.PaidAt = null;
            order.Status = OrderStatus.Failed;
        }
        if (!string.IsNullOrWhiteSpace(request.Note))
            order.Notes = MergeNote(order.Notes, request.Note.Trim());
        await _unitOfWork.Payments.UpdateAsync(payment, cancellationToken);
        await _unitOfWork.Orders.UpdateAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Ok(new { message = request.Approved ? "رسید تأیید و سفارش پرداخت‌شده شد" : "رسید رد شد؛ کاربر می‌تواند رسید جدید ارسال کند" });
    }

    [Authorize]
    [HttpPost("zarinpal/start/{orderId:int}")]
    public async Task<IActionResult> StartZarinpal(int orderId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var order = await _unitOfWork.Orders.GetByIdAsync(orderId, cancellationToken);
        if (order is null || order.UserId != userId) return NotFound(new { message = "سفارش یافت نشد" });
        if (order.Status == OrderStatus.Paid || order.Status == OrderStatus.Completed)
            return BadRequest(new { message = "این سفارش قبلاً پرداخت شده است" });

        var settings = await GetSettings(cancellationToken);
        if (!GetBool(settings, "payment.online.enabled"))
            return BadRequest(new { message = "درگاه پرداخت آنلاین فعال نیست" });
        var merchantId = Get(settings, "payment.zarinpal.merchantId");
        if (!Guid.TryParse(merchantId, out _))
            return BadRequest(new { message = "Merchant ID در تنظیمات سیستم معتبر نیست" });

        var sandbox = GetBool(settings, "payment.zarinpal.sandbox", true);
        var callback = BuildCallbackUrl(Get(settings, "payment.callbackUrl", "/api/payments/zarinpal/callback"));
        var apiBase = sandbox ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com";
        var amountRials = decimal.ToInt64(order.Amount * 10m);
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
        var request = new
        {
            merchant_id = merchantId,
            amount = amountRials,
            callback_url = callback,
            description = $"پرداخت سفارش {order.TrackingCode}",
            metadata = new { mobile = user?.PhoneNumber, email = user?.Email, order_id = order.TrackingCode }
        };

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(25);
            using var response = await client.PostAsJsonAsync($"{apiBase}/pg/v4/payment/request.json", request, cancellationToken);
            var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
            using var json = JsonDocument.Parse(responseText);
            var data = json.RootElement.TryGetProperty("data", out var dataElement) ? dataElement : default;
            var code = data.ValueKind == JsonValueKind.Object && data.TryGetProperty("code", out var codeElement) ? codeElement.GetInt32() : 0;
            var authority = data.ValueKind == JsonValueKind.Object && data.TryGetProperty("authority", out var authorityElement) ? authorityElement.GetString() : null;
            if (!response.IsSuccessStatusCode || code != 100 || string.IsNullOrWhiteSpace(authority))
                return BadRequest(new { message = "درگاه درخواست پرداخت را نپذیرفت", gatewayResponse = SafeGatewayMessage(json.RootElement) });

            var payments = await _unitOfWork.Payments.FindAsync(x => x.OrderId == order.Id, cancellationToken);
            var payment = payments.OrderByDescending(x => x.Id).FirstOrDefault();
            if (payment is null)
            {
                payment = new Payment { OrderId = order.Id, Amount = order.Amount, Gateway = "Zarinpal", Status = PaymentStatus.Processing, ReferenceId = authority, ResponseJson = responseText, CreatedAt = DateTime.UtcNow };
                await _unitOfWork.Payments.AddAsync(payment, cancellationToken);
            }
            else
            {
                payment.Status = PaymentStatus.Processing;
                payment.ReferenceId = authority;
                payment.ResponseJson = responseText;
                payment.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.Payments.UpdateAsync(payment, cancellationToken);
            }
            order.PaymentGateway = "Zarinpal";
            order.PaymentReference = authority;
            order.Status = OrderStatus.Processing;
            order.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Orders.UpdateAsync(order, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Ok(new { redirectUrl = $"{apiBase}/pg/StartPay/{authority}", authority, sandbox });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = "ارتباط با درگاه پرداخت برقرار نشد؛ دوباره تلاش کنید" });
        }
    }

    [AllowAnonymous]
    [HttpGet("zarinpal/callback")]
    public async Task<IActionResult> ZarinpalCallback([FromQuery] string? Authority, [FromQuery] string? Status, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(Authority)) return Redirect("/payment/result?status=invalid");
        var payments = await _unitOfWork.Payments.FindAsync(x => x.ReferenceId == Authority, cancellationToken);
        var payment = payments.OrderByDescending(x => x.Id).FirstOrDefault();
        if (payment is null) return Redirect("/payment/result?status=invalid");
        var order = await _unitOfWork.Orders.GetByIdAsync(payment.OrderId, cancellationToken);
        if (order is null) return Redirect("/payment/result?status=invalid");
        if (payment.Status == PaymentStatus.Successful)
            return Redirect($"/payment/result?status=success&refId={Uri.EscapeDataString(payment.BankReference ?? "")}");
        if (!string.Equals(Status, "OK", StringComparison.OrdinalIgnoreCase))
        {
            payment.Status = PaymentStatus.Failed;
            payment.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Payments.UpdateAsync(payment, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Redirect($"/payment/result?status=cancelled&order={Uri.EscapeDataString(order.TrackingCode ?? "")}");
        }

        var settings = await GetSettings(cancellationToken);
        var merchantId = Get(settings, "payment.zarinpal.merchantId");
        var sandbox = GetBool(settings, "payment.zarinpal.sandbox", true);
        if (!Guid.TryParse(merchantId, out _)) return Redirect("/payment/result?status=config-error");
        var apiBase = sandbox ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com";

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(25);
            using var response = await client.PostAsJsonAsync($"{apiBase}/pg/v4/payment/verify.json", new { merchant_id = merchantId, amount = decimal.ToInt64(order.Amount * 10m), authority = Authority }, cancellationToken);
            var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
            using var json = JsonDocument.Parse(responseText);
            var data = json.RootElement.TryGetProperty("data", out var dataElement) ? dataElement : default;
            var code = data.ValueKind == JsonValueKind.Object && data.TryGetProperty("code", out var codeElement) ? codeElement.GetInt32() : 0;
            if (response.IsSuccessStatusCode && (code == 100 || code == 101))
            {
                var refId = data.TryGetProperty("ref_id", out var refElement) ? refElement.ToString() : "";
                payment.Status = PaymentStatus.Successful;
                payment.BankReference = refId;
                payment.CardNumber = data.TryGetProperty("card_pan", out var cardElement) ? cardElement.GetString() : null;
                payment.PaidAt = DateTime.UtcNow;
                payment.ResponseJson = responseText;
                payment.UpdatedAt = DateTime.UtcNow;
                order.Status = OrderStatus.Paid;
                order.PaidAt = payment.PaidAt;
                order.PaymentGateway = "Zarinpal";
                order.PaymentReference = refId;
                order.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.Payments.UpdateAsync(payment, cancellationToken);
                await _unitOfWork.Orders.UpdateAsync(order, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                return Redirect($"/payment/result?status=success&refId={Uri.EscapeDataString(refId)}");
            }

            payment.Status = PaymentStatus.Failed;
            payment.ResponseJson = responseText;
            payment.UpdatedAt = DateTime.UtcNow;
            order.Status = OrderStatus.Failed;
            order.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Payments.UpdateAsync(payment, cancellationToken);
            await _unitOfWork.Orders.UpdateAsync(order, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Redirect("/payment/result?status=failed");
        }
        catch (Exception)
        {
            return Redirect("/payment/result?status=connection-error");
        }
    }

    private bool TryGetUserId(out int userId)
    {
        var claim = User.FindFirst("userId")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out userId);
    }

    private string BuildCallbackUrl(string callback)
    {
        if (Uri.TryCreate(callback, UriKind.Absolute, out var absolute)) return absolute.ToString();
        var path = callback.StartsWith('/') ? callback : $"/{callback}";
        return $"{Request.Scheme}://{Request.Host}{path}";
    }

    private async Task<Dictionary<string, string>> GetSettings(CancellationToken cancellationToken)
    {
        var values = await _unitOfWork.Contents.FindAsync(x => x.Page == "system" && x.Section == "settings" && x.IsActive, cancellationToken);
        return values.GroupBy(x => x.Key).ToDictionary(x => x.Key, x => x.OrderByDescending(value => value.UpdatedAt ?? value.CreatedAt).First().Value);
    }

    private static string Get(IReadOnlyDictionary<string, string> values, string key, string fallback = "") => values.TryGetValue(key, out var value) ? value : fallback;
    private static bool GetBool(IReadOnlyDictionary<string, string> values, string key, bool fallback = false) => values.TryGetValue(key, out var value) && bool.TryParse(value, out var parsed) ? parsed : fallback;
    private static string SafeGatewayMessage(JsonElement root)
    {
        if (root.TryGetProperty("errors", out var errors) && errors.ValueKind == JsonValueKind.Object && errors.TryGetProperty("message", out var message)) return message.GetString() ?? "خطای نامشخص";
        return "خطای نامشخص درگاه";
    }

    private static string PaymentStatusName(PaymentStatus status) => status switch
    {
        PaymentStatus.Pending => "در انتظار اقدام",
        PaymentStatus.Processing => "در حال بررسی",
        PaymentStatus.Successful => "موفق",
        PaymentStatus.Failed => "رد یا ناموفق",
        PaymentStatus.Refunded => "بازپرداخت‌شده",
        _ => status.ToString()
    };

    private static string MergeNote(string? current, string note)
    {
        var combined = string.IsNullOrWhiteSpace(current) ? note : $"{current}\nیادداشت بررسی: {note}";
        return combined.Length <= 1000 ? combined : combined[^1000..];
    }

    private async Task<string?> ValidateReceipt(IFormFile receipt, CancellationToken cancellationToken)
    {
        if (receipt is null || receipt.Length == 0) return "فایل رسید را انتخاب کنید";
        if (receipt.Length > MaxReceiptSize) return "حجم رسید نباید بیشتر از ۶ مگابایت باشد";
        var extension = Path.GetExtension(receipt.FileName).ToLowerInvariant();
        if (!ReceiptSignatures.TryGetValue(extension, out var signatures)) return "فرمت مجاز رسید: JPG، PNG، WEBP یا PDF";
        var header = new byte[12];
        await using var stream = receipt.OpenReadStream();
        var read = await stream.ReadAsync(header.AsMemory(0, header.Length), cancellationToken);
        if (!signatures.Any(signature => read >= signature.Length && header.AsSpan(0, signature.Length).SequenceEqual(signature)))
            return "محتوای فایل با فرمت انتخاب‌شده مطابقت ندارد";
        if (extension == ".webp" && (read < 12 || !header.AsSpan(8, 4).SequenceEqual("WEBP"u8)))
            return "فایل WEBP معتبر نیست";
        return null;
    }

    private void DeletePreviousReceipt(string? oldUrl, string newUrl)
    {
        if (string.IsNullOrWhiteSpace(oldUrl) || oldUrl == newUrl || !oldUrl.StartsWith("/uploads/receipts/", StringComparison.OrdinalIgnoreCase)) return;
        var fullPath = Path.GetFullPath(Path.Combine(_environment.WebRootPath, oldUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar)));
        var receiptRoot = Path.GetFullPath(Path.Combine(_environment.WebRootPath, "uploads", "receipts"));
        if (fullPath.StartsWith(receiptRoot, StringComparison.OrdinalIgnoreCase) && System.IO.File.Exists(fullPath))
            System.IO.File.Delete(fullPath);
    }
}

public sealed class ReviewReceiptRequest
{
    public bool Approved { get; set; }
    public string? Note { get; set; }
}
