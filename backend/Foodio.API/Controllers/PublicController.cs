using Foodio.API.Data;
using Foodio.API.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController : ControllerBase
{
    private readonly AppDbContext _db;

    public PublicController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("pois")]
    public async Task<ActionResult<IReadOnlyList<RestaurantDto>>> GetPois(
        [FromQuery] DateTimeOffset? updatedAfter,
        [FromQuery] string? lang)
    {
        var query = _db.Restaurants
            .AsNoTracking()
            .Where(r => r.IsActive)
            .Include(r => r.Category)
            .Include(r => r.Dishes)
            .Include(r => r.Reviews)
            .AsQueryable();

        if (updatedAfter.HasValue)
        {
            query = query.Where(r => r.UpdatedAt > updatedAfter.Value);
        }

        var list = await query
            .OrderByDescending(r => r.AudioPriority)
            .ThenByDescending(r => r.Rating)
            .ToListAsync();

        return Ok(list.Select(r => r.ToDto()).ToList());
    }

    [HttpGet("pois/{id}")]
    public async Task<ActionResult<RestaurantDto>> GetPoi(string id)
    {
        var poi = await _db.Restaurants
            .AsNoTracking()
            .Include(r => r.Category)
            .Include(r => r.Dishes)
            .Include(r => r.Reviews)
            .FirstOrDefaultAsync(r => r.Id == id && r.IsActive);

        if (poi is null)
        {
            return NotFound();
        }

        return Ok(poi.ToDto());
    }
}
