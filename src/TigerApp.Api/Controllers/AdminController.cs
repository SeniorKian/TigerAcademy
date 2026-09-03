using TigerApp.Application.Common.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TigerApp.Domain.Enums;
using TigerApp.Domain.Interfaces;
using TigerApp.Infrastructure.Persistence;
using TigerApp.Infrastructure.Persistence.Context;

namespace TigerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Consultant,ContentManager")]
public class AdminController : BaseApiController
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly TigerAppDbContext _dbContext;

    public AdminController(IUnitOfWork unitOfWork, TigerAppDbContext dbContext)
    {
        _unitOfWork = unitOfWork;
        _dbContext = dbContext;
    }

    [HttpPost("seed-demo-data")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SeedDemoData(CancellationToken cancellationToken)
    {
        var result = await DemoDataSeeder.SeedAsync(_dbContext, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// داشبورد مدیریت - آمار کلی
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var users = await _unitOfWork.Users.GetAllAsync();
        var orders = await _unitOfWork.Orders.GetAllAsync();
        var plans = await _unitOfWork.Plans.GetAllAsync();
        var consultations = await _unitOfWork.Consultations.GetAllAsync();

        var today = DateTime.UtcNow.Date;

        var dashboard = new
        {
            // آمار کلی
            TotalUsers = users.Count(u => u.IsActive),
            TotalOrders = orders.Count(o => o.IsActive),
            TotalPlans = plans.Count(p => p.IsActive),
            TotalConsultations = consultations.Count(c => c.IsActive),

            // آمار مالی
            TotalRevenue = orders
                .Where(o => o.Status == OrderStatus.Paid || o.Status == OrderStatus.Completed)
                .Sum(o => o.Amount),
            TodayRevenue = orders
                .Where(o => (o.Status == OrderStatus.Paid || o.Status == OrderStatus.Completed)
                    && o.PaidAt.HasValue && o.PaidAt.Value.Date == today)
                .Sum(o => o.Amount),

            // آمار سفارشات
            PendingOrders = orders.Count(o => o.Status == OrderStatus.Pending),
            PaidOrders = orders.Count(o => o.Status == OrderStatus.Paid),
            CompletedOrders = orders.Count(o => o.Status == OrderStatus.Completed),
            CancelledOrders = orders.Count(o => o.Status == OrderStatus.Cancelled),

            // کاربران جدید امروز
            TodayNewUsers = users.Count(u => u.CreatedAt.Date == today),
            TodayDate = DateTime.UtcNow.ToPersianDate(),

            MonthlyOrders = Enumerable.Range(0, 6).Select(offset => new DateTime(today.Year, today.Month, 1).AddMonths(offset - 5)).Select(month => new
            {
                Month = month.ToString("yyyy-MM"),
                Orders = orders.Count(o => o.CreatedAt.Year == month.Year && o.CreatedAt.Month == month.Month)
            }).ToList(),

            ConsultationBreakdown = consultations.GroupBy(c => c.Type).Select(group => new
            {
                Type = group.Key.ToString(),
                Name = group.Key switch
                {
                    ConsultationType.Phone => "تلفنی",
                    ConsultationType.InPerson => "حضوری",
                    ConsultationType.Online => "آنلاین",
                    _ => group.Key.ToString()
                },
                Value = group.Count()
            }).ToList(),

            // آخرین سفارشات
            RecentOrders = orders
                .OrderByDescending(o => o.CreatedAt)
                .Take(5)
                .Select(o => new
                {
                    o.Id,
                    o.Amount,
                    Status = o.Status switch
                    {
                        OrderStatus.Pending => "در انتظار پرداخت",
                        OrderStatus.Paid => "پرداخت شده",
                        OrderStatus.Completed => "تکمیل شده",
                        OrderStatus.Cancelled => "لغو شده",
                        _ => o.Status.ToString()
                    },
                    o.CreatedAt
                })
                .ToList(),

            // آخرین کاربران
            RecentUsers = users
                .OrderByDescending(u => u.CreatedAt)
                .Take(5)
                .Select(u => new
                {
                    u.Id,
                    FullName = $"{u.FirstName} {u.LastName}".Trim(),
                    u.PhoneNumber,
                    CreatedAt = u.CreatedAt.ToPersianDate()
                })
                .ToList()
        };

        return Ok(dashboard);
    }

    /// <summary>
    /// درآمد بر اساس بازه زمانی
    /// </summary>
    [HttpGet("revenue")]
    public async Task<IActionResult> GetRevenue([FromQuery] int days = 30)
    {
        var orders = await _unitOfWork.Orders.GetAllAsync();
        var startDate = DateTime.UtcNow.AddDays(-days);

        var revenueByDay = orders
            .Where(o => (o.Status == OrderStatus.Paid || o.Status == OrderStatus.Completed)
                && o.PaidAt.HasValue && o.PaidAt.Value >= startDate)
            .GroupBy(o => o.PaidAt!.Value.Date)
            .Select(g => new
            {
                Date = g.Key,
                DateShamsi = g.Key.ToPersianDate(),
                TotalAmount = g.Sum(o => o.Amount),
                OrderCount = g.Count()
            })
            .OrderBy(x => x.Date)
            .ToList();

        return Ok(revenueByDay);
    }
}
