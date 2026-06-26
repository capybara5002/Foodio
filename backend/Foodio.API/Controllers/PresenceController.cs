using Foodio.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/presence")]
public class PresenceController : ControllerBase
{
    private readonly PresenceTracker _presenceTracker;

    public PresenceController(PresenceTracker presenceTracker)
    {
        _presenceTracker = presenceTracker;
    }

    [HttpPost("heartbeat")]
    public IActionResult Heartbeat(PresenceHeartbeatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.VisitorId) || request.VisitorId.Length > 128)
        {
            return BadRequest("A valid visitor ID is required.");
        }

        _presenceTracker.RecordHeartbeat(request.VisitorId.Trim(), request.Role);
        return NoContent();
    }
}

public record PresenceHeartbeatRequest(string VisitorId, string? Role);
