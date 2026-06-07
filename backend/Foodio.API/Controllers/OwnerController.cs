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

    [HttpPost("restaurant/create/{ownerId}")]
    public async Task<ActionResult<RestaurantDto>> CreateRestaurantForOwner([FromRoute] string ownerId, [FromBody] RestaurantUpsertDto dto)
    {
        var owner = await _db.Users.FindAsync(ownerId);
        if (owner == null)
        {
            return NotFound("Owner user not found.");
        }

        if (owner.Role != "Owner")
        {
            return BadRequest("User is not an Owner.");
        }

        if (!string.IsNullOrEmpty(owner.RestaurantId))
        {
            return BadRequest("Owner already has a restaurant assigned.");
        }

        var restaurantId = CreateSlugId(dto.Name);

        var restaurant = new Restaurant
        {
            Id = restaurantId,
            Name = dto.Name,
            Rating = dto.Rating,
            PriceRange = dto.PriceRange,
            CategoryId = dto.CategoryId,
            FoodStreetId = dto.FoodStreetId,
            Distance = dto.Distance,
            Address = dto.Address,
            Area = dto.Area,
            OpeningHours = dto.OpeningHours,
            Image = string.IsNullOrWhiteSpace(dto.Image) ? "https://images.unsplash.com/photo-1555396273-367ea4eb4db5" : dto.Image,
            IsVerified = dto.IsVerified,
            ReplySpeed = dto.ReplySpeed,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            IsActive = dto.IsActive,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Restaurants.Add(restaurant);
        owner.RestaurantId = restaurantId;

        await _db.SaveChangesAsync();

        var created = await _db.Restaurants
            .Include(r => r.Category)
            .Include(r => r.Dishes)
            .Include(r => r.Reviews)
            .FirstAsync(r => r.Id == restaurant.Id);

        return Ok(created.ToDto());
    }

    private static string CreateSlugId(string name)
    {
        var safe = new string(name.ToLowerInvariant()
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : '_')
            .ToArray())
            .Trim('_');

        return $"{safe}_{Guid.NewGuid():N}"[..Math.Min(safe.Length + 33, 64)];
    }
}

