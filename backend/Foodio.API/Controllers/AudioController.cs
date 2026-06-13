using Foodio.API.Data;
using Foodio.API.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/audio")]
public class AudioController : ControllerBase
{
    private readonly AppDbContext _db;

    public AudioController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("narration")]
    public async Task<ActionResult<NarrationResponseDto>> GenerateNarration([FromBody] NarrationRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RestaurantId))
        {
            return BadRequest("RestaurantId is required.");
        }

        var restaurant = await _db.Restaurants
            .AsNoTracking()
            .Include(r => r.Category)
            .Include(r => r.Dishes)
            .FirstOrDefaultAsync(r => r.Id == dto.RestaurantId);

        if (restaurant is null)
        {
            return NotFound("Restaurant not found.");
        }

        string lang = string.IsNullOrWhiteSpace(dto.Language) ? "vi" : dto.Language.ToLower();
        string text;

        var dishNames = restaurant.Dishes.Select(d => d.Name).Take(3).ToList();
        string dishesStr = dishNames.Count > 0 ? string.Join(", ", dishNames) : (lang == "vi" ? "các món ăn đặc trưng" : "signature dishes");

        if (lang == "vi")
        {
            text = $"{restaurant.Name} là một địa điểm ẩm thực {restaurant.Category?.Name ?? "đặc sắc"} tại {restaurant.Area}, địa chỉ {restaurant.Address}. " +
                   $"Quán được đánh giá {restaurant.Rating:F1} sao với phân khúc giá {restaurant.PriceRange}. " +
                   $"Khi đến đây, bạn không nên bỏ qua các món nổi bật như {dishesStr}. " +
                   $"Quán mở cửa đón khách từ {restaurant.OpeningHours}.";
        }
        else
        {
            text = $"{restaurant.Name} is a popular {restaurant.Category?.Name ?? "dining"} spot in {restaurant.Area}, located at {restaurant.Address}. " +
                   $"It has a rating of {restaurant.Rating:F1} stars and features a {restaurant.PriceRange} price range. " +
                   $"Make sure to try their recommended dishes: {dishesStr}. " +
                   $"They are open from {restaurant.OpeningHours}.";
        }

        return Ok(new NarrationResponseDto(
            RestaurantId: restaurant.Id,
            Language: lang,
            Text: text,
            AudioUrl: restaurant.AudioUrl,
            Source: "generated"
        ));
    }
}
