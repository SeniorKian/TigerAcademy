using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class LookupsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public LookupsController(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var provinces = await _unitOfWork.Provinces.GetAllAsync(cancellationToken);
        var cities = await _unitOfWork.Cities.GetAllAsync(cancellationToken);
        var quotas = await _unitOfWork.Quotas.GetAllAsync(cancellationToken);
        var fields = await _unitOfWork.FieldsOfStudy.GetAllAsync(cancellationToken);
        return Ok(new
        {
            provinces = provinces.OrderBy(x => x.Order).Select(x => new { x.Id, x.Name }),
            cities = cities.OrderBy(x => x.Order).Select(x => new { x.Id, x.Name, x.ProvinceId }),
            quotas = quotas.OrderBy(x => x.Order).Select(x => new { x.Id, x.Name }),
            fields = fields.OrderBy(x => x.Order).Select(x => new { x.Id, x.Name, x.Code })
        });
    }
}
