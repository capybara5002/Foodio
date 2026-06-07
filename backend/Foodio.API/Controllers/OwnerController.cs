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
}
