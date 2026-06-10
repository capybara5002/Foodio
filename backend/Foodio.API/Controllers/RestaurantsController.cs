using Foodio.API.Data;
using Foodio.API.DTOs;
using Foodio.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/restaurants")]
public class RestaurantsController : ControllerBase
{
    private readonly AppDbContext _db;

    public RestaurantsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RestaurantDto>>> GetAll()
    {
        var restaurants = await IncludeRestaurantGraph(_db.Restaurants.AsNoTracking())
            .OrderBy(restaurant => restaurant.Name)
            .ToListAsync();

        return Ok(restaurants.Select(restaurant => restaurant.ToDto()).ToList());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RestaurantDto>> GetById(string id)
    {
        var restaurant = await IncludeRestaurantGraph(_db.Restaurants.AsNoTracking())
            .FirstOrDefaultAsync(item => item.Id == id);

        return restaurant is null ? NotFound() : Ok(restaurant.ToDto());
    }

    [HttpPost]
    public async Task<ActionResult<RestaurantDto>> Create(RestaurantUpsertDto dto)
    {
        var restaurant = new Restaurant
        {
            Id = CreateSlugId(dto.Name),
            Name = dto.Name,
            Rating = dto.Rating,
            PriceRange = dto.PriceRange,
            CategoryId = dto.CategoryId,
            FoodStreetId = dto.FoodStreetId,
            Distance = dto.Distance,
            Address = dto.Address,
            Area = dto.Area,
            OpeningHours = dto.OpeningHours,
            Description = dto.Description ?? string.Empty,
            TableStatuses = dto.TableStatuses,
            Image = dto.Image,
            IsVerified = dto.IsVerified,
            ReplySpeed = dto.ReplySpeed,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            IsActive = dto.IsActive,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Restaurants.Add(restaurant);
        await _db.SaveChangesAsync();

        var created = await IncludeRestaurantGraph(_db.Restaurants.AsNoTracking())
            .FirstAsync(item => item.Id == restaurant.Id);

        return CreatedAtAction(nameof(GetById), new { id = restaurant.Id }, created.ToDto());
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, RestaurantUpsertDto dto)
    {
        var restaurant = await _db.Restaurants.FindAsync(id);
        if (restaurant is null)
        {
            return NotFound();
        }

        restaurant.Name = dto.Name;
        restaurant.Rating = dto.Rating;
        restaurant.PriceRange = dto.PriceRange;
        restaurant.CategoryId = dto.CategoryId;
        restaurant.FoodStreetId = dto.FoodStreetId;
        restaurant.Distance = dto.Distance;
        restaurant.Address = dto.Address;
        restaurant.Area = dto.Area;
        restaurant.OpeningHours = dto.OpeningHours;
        restaurant.Description = dto.Description ?? string.Empty;
        restaurant.TableStatuses = dto.TableStatuses;
        restaurant.Image = dto.Image;
        restaurant.IsVerified = dto.IsVerified;
        restaurant.ReplySpeed = dto.ReplySpeed;
        restaurant.Latitude = dto.Latitude;
        restaurant.Longitude = dto.Longitude;
        restaurant.IsActive = dto.IsActive;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var restaurant = await _db.Restaurants.FindAsync(id);
        if (restaurant is null)
        {
            return NotFound();
        }

        _db.Restaurants.Remove(restaurant);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/reviews")]
    public async Task<ActionResult<FoodieReviewDto>> CreateReview(string id, FoodieReviewDto dto)
    {
        var restaurant = await _db.Restaurants
            .Include(r => r.Reviews)
            .FirstOrDefaultAsync(r => r.Id == id);
            
        if (restaurant is null)
        {
            return NotFound("Restaurant not found.");
        }

        var review = new Review
        {
            Id = string.IsNullOrWhiteSpace(dto.Id) ? $"rev_{Guid.NewGuid():N}" : dto.Id,
            RestaurantId = id,
            Author = string.IsNullOrWhiteSpace(dto.Author) ? "Anonymous" : dto.Author,
            Role = string.IsNullOrWhiteSpace(dto.Role) ? "Foodie" : dto.Role,
            Rating = dto.Rating,
            Comment = dto.Comment,
            Avatar = string.IsNullOrWhiteSpace(dto.Avatar) ? "AN" : dto.Avatar,
            ImageUrl = dto.ImageUrl,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Reviews.Add(review);

        var allReviews = restaurant.Reviews.ToList();
        allReviews.Add(review);
        restaurant.Rating = Math.Round(allReviews.Average(r => r.Rating), 1);

        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = restaurant.Id }, review.ToDto());
    }

    private static IQueryable<Restaurant> IncludeRestaurantGraph(IQueryable<Restaurant> query) =>
        query.Include(restaurant => restaurant.Category)
            .Include(restaurant => restaurant.Dishes)
            .Include(restaurant => restaurant.Reviews);

    private static string CreateSlugId(string name)
    {
        var safe = new string(name.ToLowerInvariant()
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : '_')
            .ToArray())
            .Trim('_');

        return $"{safe}_{Guid.NewGuid():N}"[..Math.Min(safe.Length + 33, 64)];
    }
}
