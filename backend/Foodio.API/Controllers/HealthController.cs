using Foodio.API.Data;
using Foodio.API.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Controllers;

[ApiController]
[Route("health")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IHubContext<ChatHub> _chatHub;

    public HealthController(AppDbContext db, IWebHostEnvironment env, IHubContext<ChatHub> chatHub)
    {
        _db = db;
        _env = env;
        _chatHub = chatHub;
    }

    [HttpGet]
    public IActionResult GetHealth()
    {
        return Ok(new
        {
            status = "ok",
            environment = _env.EnvironmentName,
            timestamp = DateTimeOffset.UtcNow
        });
    }

    [HttpGet("ready")]
    public async Task<IActionResult> GetReady()
    {
        try
        {
            // 1. Check SQL Server connection
            bool canConnect = await _db.Database.CanConnectAsync();
            if (!canConnect)
            {
                return StatusCode(503, new { status = "unhealthy", detail = "Cannot connect to SQL Server database." });
            }

            // 2. Query Restaurants
            bool hasRestaurants = await _db.Restaurants.AnyAsync();

            // 3. Verify SignalR registered
            if (_chatHub is null)
            {
                return StatusCode(503, new { status = "unhealthy", detail = "SignalR service is not registered." });
            }

            return Ok(new
            {
                status = "ready",
                database = "connected",
                restaurants = hasRestaurants ? "available" : "empty",
                signalR = "registered",
                timestamp = DateTimeOffset.UtcNow
            });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { status = "unhealthy", error = ex.Message });
        }
    }
}
