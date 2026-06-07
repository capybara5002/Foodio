using Foodio.API.Data;
using Foodio.API.DTOs;
using Foodio.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BC = BCrypt.Net.BCrypt;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("users")]
    public async Task<ActionResult<IReadOnlyList<UserDto>>> GetUsers()
    {
        var users = await _db.Users
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return Ok(users.Select(u => u.ToDto()).ToList());
    }

    [HttpPost("users")]
    public async Task<ActionResult<UserDto>> CreateUser(UserCreateUpdateDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower()))
        {
            return BadRequest("Email already exists.");
        }

        var user = new User
        {
            Id = $"usr_{Guid.NewGuid():N}",
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BC.HashPassword(string.IsNullOrWhiteSpace(dto.Password) ? "password123" : dto.Password),
            Role = dto.Role,
            RestaurantId = dto.Role == "Owner" ? dto.RestaurantId : null,
            IsActive = dto.IsActive,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(user.ToDto());
    }

    [HttpPut("users/{id}")]
    public async Task<ActionResult<UserDto>> UpdateUser(string id, UserCreateUpdateDto dto)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        if (await _db.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower() && u.Id != id))
        {
            return BadRequest("Email already in use by another account.");
        }

        user.Username = dto.Username;
        user.Email = dto.Email;
        user.Role = dto.Role;
        user.RestaurantId = dto.Role == "Owner" ? dto.RestaurantId : null;
        user.IsActive = dto.IsActive;

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            user.PasswordHash = BC.HashPassword(dto.Password);
        }

        await _db.SaveChangesAsync();

        return Ok(user.ToDto());
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("users/{id}/toggle-status")]
    public async Task<ActionResult<UserDto>> ToggleUserStatus(string id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        user.IsActive = !user.IsActive;
        await _db.SaveChangesAsync();

        return Ok(user.ToDto());
    }
}
