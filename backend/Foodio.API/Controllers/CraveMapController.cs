using Foodio.API.Data;
using Foodio.API.DTOs;
using Foodio.API.Hubs;
using Foodio.API.Models;
using Foodio.API.Services;
using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/cravemap")]
public class CraveMapController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IChatService _chatService;
    private readonly IHubContext<ChatHub> _chatHub;

    public CraveMapController(AppDbContext db, IChatService chatService, IHubContext<ChatHub> chatHub)
    {
        _db = db;
        _chatService = chatService;
        _chatHub = chatHub;
    }

    [HttpGet("restaurants")]
    public async Task<ActionResult<IReadOnlyList<RestaurantDto>>> GetRestaurants(
        [FromQuery] int? categoryId,
        [FromQuery] int? foodStreetId,
        [FromQuery] string? search)
    {
        var query = _db.Restaurants
            .AsNoTracking()
            .Where(restaurant => restaurant.IsActive)
            .Include(restaurant => restaurant.Category)
            .Include(restaurant => restaurant.Dishes)
            .Include(restaurant => restaurant.Reviews)
            .AsQueryable();

        if (categoryId.HasValue)
        {
            query = query.Where(restaurant => restaurant.CategoryId == categoryId.Value);
        }

        if (foodStreetId.HasValue)
        {
            query = query.Where(restaurant => restaurant.FoodStreetId == foodStreetId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(restaurant =>
                restaurant.Name.Contains(search) ||
                restaurant.Address.Contains(search) ||
                restaurant.Area.Contains(search));
        }

        var restaurants = await query
            .OrderByDescending(restaurant => restaurant.Rating)
            .ThenBy(restaurant => restaurant.Name)
            .ToListAsync();

        return Ok(restaurants.Select(restaurant => restaurant.ToDto()).ToList());
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> GetCategories()
    {
        var categories = await _db.Categories
            .AsNoTracking()
            .OrderBy(category => category.Name)
            .ToListAsync();

        return Ok(categories.Select(category => category.ToDto()).ToList());
    }

    [HttpGet("food-streets")]
    public async Task<ActionResult<IReadOnlyList<FoodStreetDto>>> GetFoodStreets()
    {
        var streets = await _db.FoodStreets
            .AsNoTracking()
            .OrderBy(street => street.Name)
            .ToListAsync();

        return Ok(streets.Select(street => street.ToDto()).ToList());
    }

    [HttpGet("community-posts")]
    [HttpGet("/api/communityposts")]
    public async Task<ActionResult<IReadOnlyList<CommunityPostDto>>> GetCommunityPosts()
    {
        var posts = await _db.CommunityPosts
            .AsNoTracking()
            .OrderByDescending(post => post.CreatedAt)
            .ToListAsync();

        return Ok(posts.Select(post => post.ToDto()).ToList());
    }

    [HttpPost("community-posts")]
    [HttpPost("/api/communityposts")]
    public async Task<ActionResult<CommunityPostDto>> CreateCommunityPost(CommunityPostDto dto)
    {
        var post = new CommunityPost
        {
            Id = string.IsNullOrWhiteSpace(dto.Id) ? $"post_{Guid.NewGuid():N}" : dto.Id,
            Author = dto.Author,
            Handle = dto.Handle,
            Avatar = dto.Avatar,
            TimeAgo = string.IsNullOrWhiteSpace(dto.TimeAgo) ? "Just now" : dto.TimeAgo,
            Rating = dto.Rating,
            Image = dto.Image,
            Content = dto.Content,
            LocationName = dto.LocationName,
            LikesCount = dto.LikesCount,
            CommentsCount = dto.CommentsCount,
            IsLiked = dto.IsLiked,
            IsSaved = dto.IsSaved,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.CommunityPosts.Add(post);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCommunityPosts), post.ToDto());
    }

    [HttpGet("community-posts/{postId}/comments")]
    [HttpGet("/api/communityposts/{postId}/comments")]
    public async Task<ActionResult<IReadOnlyList<PostCommentDto>>> GetPostComments(string postId)
    {
        var comments = await _db.PostComments
            .AsNoTracking()
            .Where(c => c.CommunityPostId == postId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return Ok(comments.Select(c => c.ToDto()).ToList());
    }

    [HttpPost("community-posts/{postId}/comments")]
    [HttpPost("/api/communityposts/{postId}/comments")]
    public async Task<ActionResult<PostCommentDto>> CreatePostComment(string postId, CreatePostCommentDto dto)
    {
        var post = await _db.CommunityPosts.FindAsync(postId);
        if (post is null) return NotFound("Post not found.");

        var comment = new PostComment
        {
            Id = $"pcom_{Guid.NewGuid():N}",
            CommunityPostId = postId,
            Author = "Current User",
            Avatar = "https://ui-avatars.com/api/?name=User&background=random",
            Content = dto.Content,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.PostComments.Add(comment);
        post.CommentsCount++;
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPostComments), new { postId }, comment.ToDto());
    }

    [HttpGet("chat-threads")]
    [HttpGet("/api/chatthreads")]
    public async Task<ActionResult<IReadOnlyList<ChatThreadDto>>> GetChatThreads([FromQuery] string? userId, [FromQuery] string? restaurantId)
    {
        var threads = await _chatService.GetThreadsAsync(userId, restaurantId);
        return Ok(threads);
    }

    [HttpGet("/api/chatthreads/restaurant/{restaurantId}")]
    public async Task<ActionResult<IReadOnlyList<ChatThreadDto>>> GetRestaurantChatThreads(string restaurantId)
    {
        if (string.IsNullOrWhiteSpace(restaurantId))
        {
            return BadRequest("RestaurantId is required.");
        }

        var threads = await _chatService.GetThreadsAsync(restaurantId: restaurantId);
        return Ok(threads);
    }

    [HttpPost("chat-threads/ensure")]
    public async Task<ActionResult<ChatThreadDto>> EnsureChatThread([FromBody] EnsureChatThreadDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RestaurantId))
        {
            return BadRequest("RestaurantId is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.UserId))
        {
            return BadRequest("UserId is required.");
        }

        try
        {
            var thread = await _chatService.EnsureThreadAsync(dto.RestaurantId, dto.UserId);
            await _chatHub.Clients.Group($"restaurant:{thread.RestaurantId}").SendAsync("ThreadUpdated", thread);
            return Ok(thread);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
        catch (DbUpdateException ex)
        {
            return BadRequest($"Could not create chat thread: {ex.GetBaseException().Message}");
        }
        catch (Exception ex)
        {
            return BadRequest($"Could not create chat thread: {ex.Message}");
        }
    }

    [HttpPost("chat-threads/{threadId}/messages")]
    public async Task<ActionResult<ChatMessageDto>> SendChatMessage(string threadId, [FromBody] ChatMessageDto dto)
    {
        var senderId = string.IsNullOrWhiteSpace(dto.SenderId) ? dto.Sender : dto.SenderId;
        var message = await _chatService.CreateTextMessageAsync(threadId, senderId, dto.Text);
        if (message is null)
        {
            return NotFound();
        }

        await _chatHub.Clients.Group(threadId).SendAsync("ReceiveMessage", message);
        var thread = await _chatService.GetThreadAsync(threadId);
        if (thread is not null)
        {
            await _chatHub.Clients.Group(threadId).SendAsync("ThreadUpdated", thread);
            await _chatHub.Clients.Group($"restaurant:{thread.RestaurantId}").SendAsync("ThreadUpdated", thread);
        }

        return CreatedAtAction(nameof(GetChatThreads), message);
    }

    [HttpGet("/api/chatthreads/{threadId}/messages")]
    public async Task<ActionResult<IReadOnlyList<ChatMessageDto>>> GetChatThreadMessages(string threadId)
    {
        var messages = await _chatService.GetMessagesAsync(threadId);
        if (messages is null)
        {
            return NotFound();
        }

        return Ok(messages);
    }

    [HttpPost("/api/chatmessages")]
    public async Task<ActionResult<ChatMessageDto>> CreateChatMessageDirect([FromBody] ChatMessageCreationDto dto)
    {
        var message = await _chatService.CreateDirectMessageAsync(dto);
        if (message is null)
        {
            return NotFound("Chat thread not found.");
        }

        await _chatHub.Clients.Group(dto.ChatThreadId).SendAsync("ReceiveMessage", message);
        var thread = await _chatService.GetThreadAsync(dto.ChatThreadId);
        if (thread is not null)
        {
            await _chatHub.Clients.Group(dto.ChatThreadId).SendAsync("ThreadUpdated", thread);
            await _chatHub.Clients.Group($"restaurant:{thread.RestaurantId}").SendAsync("ThreadUpdated", thread);
        }

        return CreatedAtAction(nameof(GetChatThreads), message);
    }

    [HttpGet("audio-tours")]
    public async Task<ActionResult<IReadOnlyList<AudioTourDto>>> GetAudioTours()
    {
        var tours = await _db.AudioTours
            .AsNoTracking()
            .OrderByDescending(tour => tour.IsTrending)
            .ThenByDescending(tour => tour.Rating)
            .ToListAsync();

        return Ok(tours.Select(tour => tour.ToDto()).ToList());
    }

    [HttpPost("bookings")]
    public async Task<ActionResult<BookingDto>> CreateBooking([FromBody] BookingRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RestaurantId))
        {
            return BadRequest("RestaurantId is required.");
        }

        if (dto.Guests <= 0)
        {
            return BadRequest("Guests must be greater than zero.");
        }

        if (string.IsNullOrWhiteSpace(dto.Seating))
        {
            return BadRequest("Seating is required.");
        }

        if (!DateOnly.TryParseExact(dto.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date) ||
            !TimeOnly.TryParseExact(dto.Time, new[] { "h:mm tt", "hh:mm tt", "HH:mm" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out var time))
        {
            return BadRequest("Date and time must be valid ISO-compatible values.");
        }

        var restaurantExists = await _db.Restaurants.AnyAsync(restaurant => restaurant.Id == dto.RestaurantId);
        if (!restaurantExists)
        {
            return NotFound("Restaurant was not found.");
        }

        var booking = new Booking
        {
            RestaurantId = dto.RestaurantId,
            Date = date,
            Time = time,
            Guests = dto.Guests,
            Seating = dto.Seating,
            Status = "Confirmed",
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync();

        var threadDto = await _chatService.EnsureThreadAsync(dto.RestaurantId, dto.UserId ?? "usr_3");
        var thread = await _db.ChatThreads.FindAsync(threadDto.Id);
        if (thread is not null)
        {
            var bookingMessage = await _chatService.CreateBookingMessageAsync(thread, booking);
            await _chatHub.Clients.Group(thread.Id).SendAsync("ReceiveMessage", bookingMessage);

            var updatedThread = await _chatService.GetThreadAsync(thread.Id);
            if (updatedThread is not null)
            {
                await _chatHub.Clients.Group(thread.Id).SendAsync("ThreadUpdated", updatedThread);
                await _chatHub.Clients.Group($"restaurant:{updatedThread.RestaurantId}").SendAsync("ThreadUpdated", updatedThread);
            }
        }

        var response = new BookingDto(booking.Id, booking.RestaurantId, booking.Date, booking.Time, booking.Guests, booking.Seating, booking.Status);
        return CreatedAtAction(nameof(CreateBooking), response);
    }
}
