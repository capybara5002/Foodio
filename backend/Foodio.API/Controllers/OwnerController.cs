using Foodio.API.Data;
using Foodio.API.DTOs;
using Foodio.API.Models;
using Foodio.API.Hubs;
using Foodio.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/owner")]
public class OwnerController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHubContext<ChatHub> _chatHub;
    private readonly IChatService _chatService;

    public OwnerController(AppDbContext db, IHubContext<ChatHub> chatHub, IChatService chatService)
    {
        _db = db;
        _chatHub = chatHub;
        _chatService = chatService;
    }

    [HttpGet("restaurant/{restaurantId}")]
    public async Task<ActionResult<RestaurantDto>> GetRestaurantDetails(string restaurantId, [FromQuery] string ownerId)
    {
        if (!await IsOwnerOfRestaurantAsync(ownerId, restaurantId))
        {
            return OwnerForbidden();
        }

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
    public async Task<ActionResult<RestaurantDto>> UpdateRestaurant(string restaurantId, [FromBody] RestaurantUpsertDto dto, [FromQuery] string ownerId)
    {
        var owner = await GetOwnerForRestaurantAsync(ownerId, restaurantId);
        if (owner is null)
        {
            return OwnerForbidden();
        }

        var restaurant = await _db.Restaurants
            .Include(r => r.Category)
            .Include(r => r.Dishes)
            .Include(r => r.Reviews)
            .FirstOrDefaultAsync(r => r.Id == restaurantId);

        if (restaurant == null)
        {
            return NotFound("Restaurant not found.");
        }

        // Check if new coordinates overlap with another restaurant
        var isLocationDuplicate = await _db.Restaurants
            .AnyAsync(r => r.Id != restaurantId && r.Latitude == dto.Latitude && r.Longitude == dto.Longitude);
        if (isLocationDuplicate)
        {
            return BadRequest("Tọa độ này đã được sử dụng bởi một quán ăn khác. Vui lòng chọn tọa độ khác.");
        }

        var audit = new AuditLog
        {
            Actor = owner.Username,
            Action = "Cập nhật thông tin quán ăn",
            EntityType = "Restaurant",
            EntityId = restaurantId,
            Timestamp = DateTimeOffset.UtcNow,
            Details = $"Cập nhật thông tin quán '{restaurant.Name}'"
        };
        _db.AuditLogs.Add(audit);

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
        restaurant.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(restaurant.ToDto());
    }

    [HttpPost("restaurant/{restaurantId}/dishes")]
    public async Task<ActionResult<RestaurantDto>> AddDish(string restaurantId, DishDto dto, [FromQuery] string ownerId)
    {
        if (!await IsOwnerOfRestaurantAsync(ownerId, restaurantId))
        {
            return OwnerForbidden();
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest("Dish name is required.");
        }

        if (dto.Price < 0)
        {
            return BadRequest("Dish price must be greater than or equal to zero.");
        }

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
        restaurant.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        var updated = await _db.Restaurants
            .Include(r => r.Category)
            .Include(r => r.Dishes)
            .Include(r => r.Reviews)
            .FirstOrDefaultAsync(r => r.Id == restaurantId);

        return Ok(updated!.ToDto());
    }

    [HttpDelete("restaurant/{restaurantId}/dishes/{dishId}")]
    public async Task<ActionResult<RestaurantDto>> DeleteDish(string restaurantId, string dishId, [FromQuery] string ownerId)
    {
        if (!await IsOwnerOfRestaurantAsync(ownerId, restaurantId))
        {
            return OwnerForbidden();
        }

        var dish = await _db.MenuItems.FirstOrDefaultAsync(m => m.RestaurantId == restaurantId && m.Id == dishId);
        if (dish == null)
        {
            return NotFound("Dish not found or does not belong to this restaurant.");
        }

        _db.MenuItems.Remove(dish);
        var restaurant = await _db.Restaurants.FindAsync(restaurantId);
        if (restaurant is not null)
        {
            restaurant.UpdatedAt = DateTimeOffset.UtcNow;
        }
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

        // Check if coordinates overlap with an existing restaurant or another pending request
        var isLocationDuplicate = await _db.Restaurants
            .AnyAsync(r => r.Latitude == dto.Latitude && r.Longitude == dto.Longitude);
        var isLocationDuplicateInRequests = await _db.RestaurantRequests
            .AnyAsync(r => r.Status == "Pending" && r.Latitude == dto.Latitude && r.Longitude == dto.Longitude);
        if (isLocationDuplicate || isLocationDuplicateInRequests)
        {
            return BadRequest("Tọa độ này đã được đăng ký hoặc đang chờ duyệt bởi một quán ăn khác. Vui lòng chọn tọa độ khác.");
        }

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

        owner.OwnerStatus = "Pending";
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

    [HttpGet("restaurant/{restaurantId}/bookings")]
    public async Task<ActionResult<IReadOnlyList<BookingDto>>> GetBookings(string restaurantId, [FromQuery] string ownerId)
    {
        if (!await IsOwnerOfRestaurantAsync(ownerId, restaurantId))
        {
            return OwnerForbidden();
        }

        var bookings = await _db.Bookings
            .Where(b => b.RestaurantId == restaurantId)
            .OrderByDescending(b => b.Date)
            .ThenByDescending(b => b.Time)
            .ToListAsync();

        return Ok(bookings.Select(b => b.ToDto()).ToList());
    }

    [HttpPost("bookings/{bookingId}/status")]
    public async Task<IActionResult> UpdateBookingStatus(int bookingId, [FromBody] BookingStatusUpdateDto dto, [FromQuery] string ownerId)
    {
        var booking = await _db.Bookings.FindAsync(bookingId);
        if (booking == null)
        {
            return NotFound("Booking not found.");
        }

        var owner = await GetOwnerForRestaurantAsync(ownerId, booking.RestaurantId);
        if (owner is null)
        {
            return OwnerForbidden();
        }

        var oldStatus = booking.Status;
        booking.Status = dto.Status;

        var audit = new AuditLog
        {
            Actor = owner.Username,
            Action = "Cập nhật trạng thái đặt bàn",
            EntityType = "Booking",
            EntityId = bookingId.ToString(),
            Timestamp = DateTimeOffset.UtcNow,
            Details = $"Đổi trạng thái đơn đặt bàn #{bookingId} từ '{oldStatus}' thành '{dto.Status}'"
        };
        _db.AuditLogs.Add(audit);

        await _db.SaveChangesAsync();

        // System message in chat thread if thread exists
        var thread = await _db.ChatThreads
            .FirstOrDefaultAsync(t => t.RestaurantId == booking.RestaurantId && t.UserId == booking.UserId);
        if (thread != null)
        {
            var statusVi = dto.Status switch
            {
                "Pending" => "Chờ duyệt",
                "Confirmed" => "Đã nhận",
                "Rejected" => "Bị từ chối",
                "Completed" => "Hoàn thành",
                "Cancelled" => "Đã hủy",
                _ => dto.Status
            };

            var message = new ChatMessage
            {
                Id = $"msg_{Guid.NewGuid():N}",
                ChatThreadId = thread.Id,
                Sender = "system",
                SenderId = "system",
                Text = $"Đơn đặt bàn #{bookingId} của bạn đã được cập nhật thành: {statusVi}",
                Timestamp = DateTimeOffset.UtcNow.ToString("h:mm tt"),
                MessageType = "Text",
                IsSystemNotification = true,
                CreatedAt = DateTimeOffset.UtcNow
            };
            _db.ChatMessages.Add(message);

            thread.LastMessageText = message.Text;
            thread.LastMessageTime = DateTimeOffset.UtcNow.ToString("O");
            await _db.SaveChangesAsync();

            // Broadcast via SignalR
            var messageDto = message.ToDto();
            await _chatHub.Clients.Group(thread.Id).SendAsync("ReceiveMessage", messageDto);
            
            var updatedThread = await _chatService.GetThreadAsync(thread.Id);
            if (updatedThread != null)
            {
                await _chatHub.Clients.Group(thread.Id).SendAsync("ThreadUpdated", updatedThread);
                await _chatHub.Clients.Group($"restaurant:{updatedThread.RestaurantId}").SendAsync("ThreadUpdated", updatedThread);
            }
        }

        return NoContent();
    }

    [HttpGet("notifications")]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> GetNotifications([FromQuery] string ownerId)
    {
        if (!await IsActiveOwnerAsync(ownerId))
        {
            return OwnerForbidden();
        }

        var notifications = await _db.Notifications
            .Where(n => n.UserId == ownerId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return Ok(notifications.Select(n => n.ToDto()).ToList());
    }

    [HttpPost("notifications/{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id, [FromQuery] string ownerId)
    {
        var notification = await _db.Notifications.FindAsync(id);
        if (notification == null) return NotFound("Notification not found.");
        if (!string.Equals(notification.UserId, ownerId, StringComparison.Ordinal) || !await IsActiveOwnerAsync(ownerId))
        {
            return OwnerForbidden();
        }

        notification.IsRead = true;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("reviews/{reviewId}/report")]
    public async Task<IActionResult> ReportReview(string reviewId, [FromQuery] string ownerId)
    {
        var review = await _db.Reviews.Include(r => r.Restaurant).FirstOrDefaultAsync(r => r.Id == reviewId);
        if (review == null) return NotFound("Review not found.");

        var owner = await _db.Users.FindAsync(ownerId);
        if (owner == null || owner.RestaurantId != review.RestaurantId)
        {
            return BadRequest("You do not have permission to report reviews for this restaurant.");
        }

        // Create notification for Admin ("usr_1")
        var adminNotif = new Notification
        {
            UserId = "usr_1", // Admin
            RestaurantId = review.RestaurantId,
            Type = "ReportReview",
            Title = "Đánh giá bị báo cáo",
            Body = $"Chủ quán '{owner.Username}' báo cáo đánh giá của '{review.Author}' tại quán '{review.Restaurant?.Name}': \"{review.Comment}\"",
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.Notifications.Add(adminNotif);

        // Audit log
        var log = new AuditLog
        {
            Actor = owner.Username,
            Action = "Báo cáo đánh giá",
            EntityType = "Review",
            EntityId = reviewId,
            Timestamp = DateTimeOffset.UtcNow,
            Details = $"Báo cáo đánh giá của '{review.Author}'"
        };
        _db.AuditLogs.Add(log);

        await _db.SaveChangesAsync();
        return Ok(new { message = "Review reported successfully." });
    }

    [HttpGet("restaurant/{restaurantId}/analytics")]
    public async Task<ActionResult<RestaurantAnalyticsDto>> GetAnalytics(string restaurantId, [FromQuery] string ownerId)
    {
        if (!await IsOwnerOfRestaurantAsync(ownerId, restaurantId))
        {
            return OwnerForbidden();
        }

        var restaurant = await _db.Restaurants
            .Include(r => r.Reviews)
            .FirstOrDefaultAsync(r => r.Id == restaurantId);

        if (restaurant == null)
        {
            return NotFound("Restaurant not found.");
        }

        var bookings = await _db.Bookings
            .Where(b => b.RestaurantId == restaurantId)
            .ToListAsync();

        int totalBookings = bookings.Count;
        int pending = bookings.Count(b => b.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase) || b.Status.Equals("Chờ duyệt", StringComparison.OrdinalIgnoreCase));
        int confirmed = bookings.Count(b => b.Status.Equals("Confirmed", StringComparison.OrdinalIgnoreCase) || b.Status.Equals("Đã nhận", StringComparison.OrdinalIgnoreCase));
        int completed = bookings.Count(b => b.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase) || b.Status.Equals("Hoàn thành", StringComparison.OrdinalIgnoreCase));
        int cancelled = bookings.Count(b => b.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase) || b.Status.Equals("Rejected", StringComparison.OrdinalIgnoreCase) || b.Status.Equals("Đã hủy", StringComparison.OrdinalIgnoreCase));

        int totalReviews = restaurant.Reviews.Count;
        decimal avgRating = restaurant.Rating;

        return Ok(new RestaurantAnalyticsDto(
            totalBookings,
            pending,
            confirmed,
            completed,
            cancelled,
            totalReviews,
            avgRating
        ));
    }

    public record BookingStatusUpdateDto(string Status);
    public record RestaurantAnalyticsDto(
        int TotalBookings,
        int PendingBookings,
        int ConfirmedBookings,
        int CompletedBookings,
        int CancelledBookings,
        int TotalReviews,
        decimal AverageRating
    );

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

    private async Task<User?> GetOwnerForRestaurantAsync(string? ownerId, string restaurantId)
    {
        if (string.IsNullOrWhiteSpace(ownerId))
        {
            return null;
        }

        var owner = await _db.Users.FindAsync(ownerId);
        if (owner is null ||
            owner.Role != "Owner" ||
            !owner.IsActive ||
            owner.RestaurantId != restaurantId ||
            !string.Equals(owner.OwnerStatus, "Verified", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return owner;
    }

    private async Task<bool> IsOwnerOfRestaurantAsync(string? ownerId, string restaurantId) =>
        await GetOwnerForRestaurantAsync(ownerId, restaurantId) is not null;

    private async Task<bool> IsActiveOwnerAsync(string? ownerId)
    {
        if (string.IsNullOrWhiteSpace(ownerId))
        {
            return false;
        }

        var owner = await _db.Users.FindAsync(ownerId);
        return owner is not null && owner.Role == "Owner" && owner.IsActive;
    }

    private ObjectResult OwnerForbidden() =>
        StatusCode(StatusCodes.Status403Forbidden, new { message = "Owner does not have permission for this resource." });
}
