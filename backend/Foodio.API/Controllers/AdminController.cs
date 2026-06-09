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

        user.IsActive = false;
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

    // ── Restaurant Request Management ──

    [HttpGet("restaurant-requests")]
    public async Task<ActionResult<IReadOnlyList<RestaurantRequestDto>>> GetRestaurantRequests([FromQuery] string? status = null)
    {
        var query = _db.RestaurantRequests
            .Include(r => r.Owner)
            .Include(r => r.Category)
            .Include(r => r.FoodStreet)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);

        var requests = await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return Ok(requests.Select(ToRequestDto).ToList());
    }

    [HttpPost("restaurant-requests/{id}/approve")]
    public async Task<ActionResult<RestaurantRequestDto>> ApproveRequest(string id)
    {
        var request = await _db.RestaurantRequests
            .Include(r => r.Owner)
            .Include(r => r.Category)
            .Include(r => r.FoodStreet)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null) return NotFound("Request not found.");
        if (request.Status != "Pending") return BadRequest($"Request is already {request.Status}.");

        // Create the restaurant
        var restaurantId = CreateSlugId(request.Name);

        var restaurant = new Restaurant
        {
            Id = restaurantId,
            Name = request.Name,
            Rating = 0,
            PriceRange = request.PriceRange,
            CategoryId = request.CategoryId,
            FoodStreetId = request.FoodStreetId,
            Distance = request.Distance,
            Address = request.Address,
            Area = request.Area,
            OpeningHours = request.OpeningHours,
            Image = request.Image,
            IsVerified = false,
            ReplySpeed = "Thường trả lời trong 5 phút",
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Restaurants.Add(restaurant);

        // Link restaurant to owner
        var owner = await _db.Users.FindAsync(request.OwnerId);
        if (owner != null)
        {
            owner.RestaurantId = restaurantId;
        }

        request.Status = "Approved";
        request.ReviewedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ToRequestDto(request));
    }

    [HttpPost("restaurant-requests/{id}/reject")]
    public async Task<ActionResult<RestaurantRequestDto>> RejectRequest(string id, [FromBody] RestaurantRequestReviewDto dto)
    {
        var request = await _db.RestaurantRequests
            .Include(r => r.Owner)
            .Include(r => r.Category)
            .Include(r => r.FoodStreet)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null) return NotFound("Request not found.");
        if (request.Status != "Pending") return BadRequest($"Request is already {request.Status}.");

        request.Status = "Rejected";
        request.AdminNote = dto.AdminNote;
        request.ReviewedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ToRequestDto(request));
    }

    // ── Helpers ──

    private static RestaurantRequestDto ToRequestDto(RestaurantRequest r) => new(
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

    // ── Audio Tour Management ──

    [HttpGet("audio-tours")]
    public async Task<ActionResult<IReadOnlyList<AudioTourDto>>> GetAudioTours()
    {
        var tours = await _db.AudioTours
            .OrderBy(t => t.Title)
            .ToListAsync();
        return Ok(tours.Select(t => t.ToDto()).ToList());
    }

    [HttpPost("audio-tours")]
    public async Task<ActionResult<AudioTourDto>> CreateAudioTour(AudioTourDto dto)
    {
        var tour = new AudioTour
        {
            Id = $"tour_{Guid.NewGuid():N}"[..Math.Min(20, 64)],
            Title = dto.Title,
            Location = dto.Location,
            Image = string.IsNullOrWhiteSpace(dto.Image) ? "https://images.unsplash.com/photo-1559737558-2f5a35f4523b" : dto.Image,
            MapImage = string.IsNullOrWhiteSpace(dto.MapImage) ? "https://images.unsplash.com/photo-1559737558-2f5a35f4523b" : dto.MapImage,
            IsTrending = dto.IsTrending,
            Rating = dto.Rating,
            Duration = dto.Duration,
            StopsCount = dto.StopsCount,
            Vibe = dto.Vibe,
            Description = dto.Description
        };

        _db.AudioTours.Add(tour);
        await _db.SaveChangesAsync();

        return Ok(tour.ToDto());
    }

    [HttpPut("audio-tours/{id}")]
    public async Task<ActionResult<AudioTourDto>> UpdateAudioTour(string id, AudioTourDto dto)
    {
        var tour = await _db.AudioTours.FindAsync(id);
        if (tour == null)
        {
            return NotFound("Audio tour not found.");
        }

        tour.Title = dto.Title;
        tour.Location = dto.Location;
        tour.Image = dto.Image;
        tour.MapImage = dto.MapImage;
        tour.IsTrending = dto.IsTrending;
        tour.Rating = dto.Rating;
        tour.Duration = dto.Duration;
        tour.StopsCount = dto.StopsCount;
        tour.Vibe = dto.Vibe;
        tour.Description = dto.Description;

        await _db.SaveChangesAsync();

        return Ok(tour.ToDto());
    }

    [HttpDelete("audio-tours/{id}")]
    public async Task<IActionResult> DeleteAudioTour(string id)
    {
        var tour = await _db.AudioTours.FindAsync(id);
        if (tour == null)
        {
            return NotFound("Audio tour not found.");
        }

        _db.AudioTours.Remove(tour);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // ── Moderation System ──

    [HttpGet("posts")]
    public async Task<ActionResult<IReadOnlyList<CommunityPostDto>>> GetPosts()
    {
        var posts = await _db.CommunityPosts
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(posts.Select(p => p.ToDto()).ToList());
    }

    [HttpDelete("posts/{id}")]
    public async Task<IActionResult> DeletePost(string id)
    {
        var post = await _db.CommunityPosts.FindAsync(id);
        if (post == null)
        {
            return NotFound("Post not found.");
        }

        _db.CommunityPosts.Remove(post);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("reviews")]
    public async Task<ActionResult<IReadOnlyList<AdminReviewDto>>> GetReviews()
    {
        var reviews = await _db.Reviews
            .Include(r => r.Restaurant)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var dtos = reviews.Select(r => new AdminReviewDto(
            r.Id,
            r.RestaurantId,
            r.Restaurant?.Name ?? "",
            r.Author,
            r.Role,
            r.Rating,
            r.Comment,
            r.CreatedAt
        )).ToList();

        return Ok(dtos);
    }

    [HttpDelete("reviews/{id}")]
    public async Task<IActionResult> DeleteReview(string id)
    {
        var review = await _db.Reviews.FindAsync(id);
        if (review == null)
        {
            return NotFound("Review not found.");
        }

        _db.Reviews.Remove(review);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    public record AdminReviewDto(
        string Id,
        string RestaurantId,
        string RestaurantName,
        string Author,
        string Role,
        decimal Rating,
        string Comment,
        DateTimeOffset CreatedAt
    );

    private static string CreateSlugId(string name)
    {
        var safe = new string(name.ToLowerInvariant()
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : '_')
            .ToArray())
            .Trim('_');

        return $"{safe}_{Guid.NewGuid():N}"[..Math.Min(safe.Length + 33, 64)];
    }
}
