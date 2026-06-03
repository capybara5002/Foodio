using Foodio.API.Data;
using Foodio.API.DTOs;
using Foodio.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/food-streets")]
public class FoodStreetsController : ControllerBase
{
    private readonly AppDbContext _db;

    public FoodStreetsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<FoodStreetDto>>> GetAll()
    {
        var streets = await _db.FoodStreets.AsNoTracking().OrderBy(street => street.Name).ToListAsync();
        return Ok(streets.Select(street => street.ToDto()).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<FoodStreetDto>> GetById(int id)
    {
        var street = await _db.FoodStreets.AsNoTracking().FirstOrDefaultAsync(item => item.Id == id);
        return street is null ? NotFound() : Ok(street.ToDto());
    }

    [HttpPost]
    public async Task<ActionResult<FoodStreetDto>> Create(FoodStreetDto dto)
    {
        var street = new FoodStreet
        {
            Name = dto.Name,
            District = dto.District,
            Description = dto.Description,
            CenterLatitude = dto.CenterLatitude,
            CenterLongitude = dto.CenterLongitude,
            OpeningWindow = dto.OpeningWindow
        };

        _db.FoodStreets.Add(street);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = street.Id }, street.ToDto());
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, FoodStreetDto dto)
    {
        var street = await _db.FoodStreets.FindAsync(id);
        if (street is null)
        {
            return NotFound();
        }

        street.Name = dto.Name;
        street.District = dto.District;
        street.Description = dto.Description;
        street.CenterLatitude = dto.CenterLatitude;
        street.CenterLongitude = dto.CenterLongitude;
        street.OpeningWindow = dto.OpeningWindow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var street = await _db.FoodStreets.FindAsync(id);
        if (street is null)
        {
            return NotFound();
        }

        _db.FoodStreets.Remove(street);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
