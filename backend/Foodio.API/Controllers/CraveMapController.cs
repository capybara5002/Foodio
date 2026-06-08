using Foodio.API.Data;
using Foodio.API.DTOs;
using Foodio.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/cravemap")]
public class CraveMapController : ControllerBase
{
    private readonly AppDbContext _db;

    public CraveMapController(AppDbContext db)
    {
        _db = db;
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
    public async Task<ActionResult<IReadOnlyList<ChatThreadDto>>> GetChatThreads()
    {
        var threads = await _db.ChatThreads
            .AsNoTracking()
            .Include(thread => thread.Messages)
            .OrderBy(thread => thread.Name)
            .ToListAsync();

        return Ok(threads.Select(thread => thread.ToDto()).ToList());
    }

    [HttpPost("chat-threads/{threadId}/messages")]
    public async Task<ActionResult<ChatMessageDto>> SendChatMessage(string threadId, ChatMessageDto dto)
    {
        var thread = await _db.ChatThreads.FindAsync(threadId);
        if (thread is null)
        {
            return NotFound();
        }

        var message = new ChatMessage
        {
            Id = string.IsNullOrWhiteSpace(dto.Id) ? $"msg_{Guid.NewGuid():N}" : dto.Id,
            ChatThreadId = threadId,
            Sender = dto.Sender,
            Text = dto.Text,
            Timestamp = string.IsNullOrWhiteSpace(dto.Timestamp) ? "Just now" : dto.Timestamp,
            Status = dto.Status,
            CreatedAt = DateTimeOffset.UtcNow
        };

        thread.LastMessageText = message.Text;
        thread.LastMessageTime = message.Timestamp;

        _db.ChatMessages.Add(message);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetChatThreads), message.ToDto());
    }

    [HttpGet("/api/chatthreads/{threadId}/messages")]
    public async Task<ActionResult<IReadOnlyList<ChatMessageDto>>> GetChatThreadMessages(string threadId)
    {
        var thread = await _db.ChatThreads
            .AsNoTracking()
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == threadId);

        if (thread is null)
        {
            return NotFound();
        }

        var messagesDto = thread.Messages
            .OrderBy(m => m.CreatedAt)
            .Select(m => m.ToDto())
            .ToList();

        return Ok(messagesDto);
    }

    [HttpPost("/api/chatmessages")]
    public async Task<ActionResult<ChatMessageDto>> CreateChatMessageDirect(ChatMessageCreationDto dto)
    {
        var thread = await _db.ChatThreads.FindAsync(dto.ChatThreadId);
        if (thread is null)
        {
            return NotFound("Chat thread not found.");
        }

        var message = new ChatMessage
        {
            Id = $"msg_{Guid.NewGuid():N}",
            ChatThreadId = dto.ChatThreadId,
            Sender = dto.Sender,
            Text = dto.Text,
            Timestamp = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(7)).ToString("h:mm tt"),
            Status = "sent",
            CreatedAt = DateTimeOffset.UtcNow
        };

        thread.LastMessageText = message.Text;
        thread.LastMessageTime = message.Timestamp;

        _db.ChatMessages.Add(message);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetChatThreads), message.ToDto());
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
    public async Task<ActionResult<BookingDto>> CreateBooking(BookingRequestDto dto)
    {
        if (!DateOnly.TryParse(dto.Date, out var date) || !TimeOnly.TryParse(dto.Time, out var time))
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

        var response = new BookingDto(booking.Id, booking.RestaurantId, booking.Date, booking.Time, booking.Guests, booking.Seating, booking.Status);
        return CreatedAtAction(nameof(CreateBooking), response);
    }
}
