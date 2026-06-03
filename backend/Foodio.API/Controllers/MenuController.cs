using Foodio.API.Data;
using Foodio.API.DTOs;
using Foodio.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/restaurants/{restaurantId}/menu")]
public class MenuController : ControllerBase
{
    private readonly AppDbContext _db;

    public MenuController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DishDto>>> GetForRestaurant(string restaurantId)
    {
        var exists = await _db.Restaurants.AnyAsync(restaurant => restaurant.Id == restaurantId);
        if (!exists)
        {
            return NotFound();
        }

        var dishes = await _db.MenuItems
            .AsNoTracking()
            .Where(item => item.RestaurantId == restaurantId)
            .OrderBy(item => item.Name)
            .ToListAsync();

        return Ok(dishes.Select(dish => dish.ToDto()).ToList());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DishDto>> GetById(string restaurantId, string id)
    {
        var dish = await _db.MenuItems
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.RestaurantId == restaurantId && item.Id == id);

        return dish is null ? NotFound() : Ok(dish.ToDto());
    }

    [HttpPost]
    public async Task<ActionResult<DishDto>> Create(string restaurantId, DishDto dto)
    {
        var exists = await _db.Restaurants.AnyAsync(restaurant => restaurant.Id == restaurantId);
        if (!exists)
        {
            return NotFound();
        }

        var dish = new MenuItem
        {
            Id = string.IsNullOrWhiteSpace(dto.Id) ? $"dish_{Guid.NewGuid():N}" : dto.Id,
            RestaurantId = restaurantId,
            Name = dto.Name,
            Price = dto.Price,
            Image = dto.Image,
            Description = dto.Description,
            IsAvailable = true
        };

        _db.MenuItems.Add(dish);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { restaurantId, id = dish.Id }, dish.ToDto());
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string restaurantId, string id, DishDto dto)
    {
        var dish = await _db.MenuItems.FirstOrDefaultAsync(item => item.RestaurantId == restaurantId && item.Id == id);
        if (dish is null)
        {
            return NotFound();
        }

        dish.Name = dto.Name;
        dish.Price = dto.Price;
        dish.Image = dto.Image;
        dish.Description = dto.Description;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string restaurantId, string id)
    {
        var dish = await _db.MenuItems.FirstOrDefaultAsync(item => item.RestaurantId == restaurantId && item.Id == id);
        if (dish is null)
        {
            return NotFound();
        }

        _db.MenuItems.Remove(dish);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
