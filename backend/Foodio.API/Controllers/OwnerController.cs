using Foodio.API.Data;
using Foodio.API.DTOs;
using Foodio.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/owner")]
public class OwnerController : ControllerBase
{
    private readonly AppDbContext _db;

    public OwnerController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("restaurant/{restaurantId}")]
    public async Task<ActionResult<RestaurantDto>> GetRestaurantDetails(string restaurantId)
    {
        var restaurant = await _db.Restaurants
            .Include(r => r.Category)
            .Include(r => r.Dishes)
            .Include(r => r.Reviews)
            .FirstOrDefaultAsync(r => r.Id == restaurantId);

        if (restaurant == null)
        {
            return NotFound("Restaurant not found.");
        }

        return Ok(restaurant.ToDto());
    }

    [HttpPut("restaurant/{restaurantId}")]
    public async Task<ActionResult<RestaurantDto>> UpdateRestaurant(string restaurantId, RestaurantUpsertDto dto)
    {
        var restaurant = await _db.Restaurants
            .Include(r => r.Category)
            .Include(r => r.Dishes)
            .Include(r => r.Reviews)
            .FirstOrDefaultAsync(r => r.Id == restaurantId);

        if (restaurant == null)
        {
            return NotFound("Restaurant not found.");
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
        restaurant.Image = dto.Image;
        restaurant.IsVerified = dto.IsVerified;
        restaurant.ReplySpeed = dto.ReplySpeed;
        restaurant.Latitude = dto.Latitude;
        restaurant.Longitude = dto.Longitude;
        restaurant.IsActive = dto.IsActive;

        await _db.SaveChangesAsync();

        return Ok(restaurant.ToDto());
    }

    [HttpPost("restaurant/{restaurantId}/dishes")]
    public async Task<ActionResult<RestaurantDto>> AddDish(string restaurantId, DishDto dto)
    {
        var restaurant = await _db.Restaurants
            .Include(r => r.Dishes)
            .FirstOrDefaultAsync(r => r.Id == restaurantId);

        if (restaurant == null)
        {
            return NotFound("Restaurant not found.");
        }

        var dish = new MenuItem
        {
            Id = $"dish_{Guid.NewGuid():N}",
            RestaurantId = restaurantId,
            Name = dto.Name,
            Price = dto.Price,
            Image = string.IsNullOrWhiteSpace(dto.Image) ? "https://images.unsplash.com/photo-1559737558-2f5a35f4523b" : dto.Image,
            Description = dto.Description ?? string.Empty,
            IsAvailable = true
        };

        _db.MenuItems.Add(dish);
        await _db.SaveChangesAsync();

        var updated = await _db.Restaurants
            .Include(r => r.Category)
            .Include(r => r.Dishes)
            .Include(r => r.Reviews)
            .FirstOrDefaultAsync(r => r.Id == restaurantId);

        return Ok(updated!.ToDto());
    }

    [HttpDelete("restaurant/{restaurantId}/dishes/{dishId}")]
    public async Task<ActionResult<RestaurantDto>> DeleteDish(string restaurantId, string dishId)
    {
        var dish = await _db.MenuItems.FirstOrDefaultAsync(m => m.RestaurantId == restaurantId && m.Id == dishId);
        if (dish == null)
        {
            return NotFound("Dish not found or does not belong to this restaurant.");
        }

        _db.MenuItems.Remove(dish);
        await _db.SaveChangesAsync();

        var updated = await _db.Restaurants
            .Include(r => r.Category)
            .Include(r => r.Dishes)
            .Include(r => r.Reviews)
            .FirstOrDefaultAsync(r => r.Id == restaurantId);

        return Ok(updated!.ToDto());
    }

    // ── Restaurant Request (Admin Approval Workflow) ──

    [HttpPost("restaurant-request")]
    public async Task<ActionResult<RestaurantRequestDto>> SubmitRestaurantRequest([FromBody] RestaurantRequestCreateDto dto, [FromQuery] string ownerId)
    {
        var owner = await _db.Users.FindAsync(ownerId);
        if (owner == null) return NotFound("Owner not found.");
        if (owner.Role != "Owner") return BadRequest("User is not an Owner.");
        if (!string.IsNullOrEmpty(owner.RestaurantId))
            return BadRequest("Owner already has a restaurant assigned.");

        // Check for any existing pending request
        var existing = await _db.RestaurantRequests
            .FirstOrDefaultAsync(r => r.OwnerId == ownerId && r.Status == "Pending");
        if (existing != null)
            return BadRequest("You already have a pending request.");

        var request = new RestaurantRequest
        {
            Id = $"req_{Guid.NewGuid():N}"[..Math.Min(36, 64)],
            OwnerId = ownerId,
            Name = dto.Name,
            PriceRange = dto.PriceRange,
            CategoryId = dto.CategoryId,
            FoodStreetId = dto.FoodStreetId,
            Distance = dto.Distance,
            Address = dto.Address,
            Area = dto.Area,
            OpeningHours = dto.OpeningHours,
            Image = string.IsNullOrWhiteSpace(dto.Image)
                ? "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
                : dto.Image,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Status = "Pending",
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.RestaurantRequests.Add(request);
        await _db.SaveChangesAsync();

        // Re-load with navigation props
        var saved = await _db.RestaurantRequests
            .Include(r => r.Owner)
            .Include(r => r.Category)
            .Include(r => r.FoodStreet)
            .FirstAsync(r => r.Id == request.Id);

        return Ok(ToDto(saved));
    }

    [HttpGet("restaurant-request/{ownerId}")]
    public async Task<ActionResult<RestaurantRequestDto>> GetMyRequest(string ownerId)
    {
        var request = await _db.RestaurantRequests
            .Include(r => r.Owner)
            .Include(r => r.Category)
            .Include(r => r.FoodStreet)
            .Where(r => r.OwnerId == ownerId)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        if (request == null) return NotFound("No request found.");

        return Ok(ToDto(request));
    }

    private static RestaurantRequestDto ToDto(RestaurantRequest r) => new(
        r.Id,
        r.OwnerId,
        r.Owner?.Username ?? "",
        r.Owner?.Email ?? "",
        r.Name,
        r.PriceRange,
        r.Category?.Name ?? "",
        r.FoodStreet?.Name ?? "",
        r.Distance,
        r.Address,
        r.Area,
        r.OpeningHours,
        r.Image,
        r.Latitude,
        r.Longitude,
        r.Status,
        r.AdminNote,
        r.CreatedAt,
        r.ReviewedAt);
}
