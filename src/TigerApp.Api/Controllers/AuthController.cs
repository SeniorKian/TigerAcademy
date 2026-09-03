using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TigerApp.Application.Features.Auth.Commands.Login;
using TigerApp.Application.Features.Auth.Commands.Logout;
using TigerApp.Application.Features.Auth.Commands.RefreshTokenCmd;
using TigerApp.Application.Features.Auth.Commands.Register;
using TigerApp.Domain.Interfaces;

namespace TigerApp.Api.Controllers;

public class AuthController : BaseApiController
{
    private readonly IUnitOfWork _unitOfWork;

    public AuthController(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    [HttpPost("login")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        
        if (result.IsSuccess)
            return Ok(result);
        
        return BadRequest(result);
    }
    
    [HttpPost("register")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command, CancellationToken cancellationToken)
    {
        var registrationSettings = await _unitOfWork.Contents.FindAsync(
            x => x.Page == "system" && x.Section == "settings" && x.Key == "system.registrationEnabled" && x.IsActive,
            cancellationToken);
        var registrationEnabled = registrationSettings
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .Select(x => bool.TryParse(x.Value, out var enabled) ? enabled : true)
            .FirstOrDefault(true);
        if (!registrationEnabled)
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "ثبت‌نام کاربران در حال حاضر غیرفعال است" });

        var result = await Mediator.Send(command, cancellationToken);
        
        if (result.IsSuccess)
            return Ok(result);
        
        return BadRequest(result);
    }
    
    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        
        if (result.IsSuccess)
            return Ok(result);
        
        return BadRequest(result);
    }
    
    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout([FromBody] LogoutCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }
}
