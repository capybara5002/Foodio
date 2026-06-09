using System.Text.Json;
using Foodio.API.Data;
using Foodio.API.DTOs;
using Foodio.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Services;

public class ChatService : IChatService
{
    private static readonly TimeSpan VietnamOffset = TimeSpan.FromHours(7);
    private readonly AppDbContext _db;

    public ChatService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ChatThreadDto>> GetThreadsAsync(string? userId = null, string? restaurantId = null)
    {
        var query = _db.ChatThreads
            .AsNoTracking()
            .Include(thread => thread.Messages)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(userId))
        {
            query = query.Where(thread => thread.UserId == userId);
        }

        if (!string.IsNullOrWhiteSpace(restaurantId))
        {
            query = query.Where(thread => thread.RestaurantId == restaurantId);
        }

        var threads = await query
            .OrderByDescending(thread => thread.LastMessageTime)
            .ThenBy(thread => thread.Name)
            .ToListAsync();

        var customers = await LoadCustomersAsync(threads.Select(thread => thread.UserId));
        return threads.Select(thread => thread.ToDto(GetCustomer(customers, thread.UserId))).ToList();
    }

    public async Task<ChatThreadDto?> GetThreadAsync(string threadId)
    {
        var thread = await _db.ChatThreads
            .AsNoTracking()
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == threadId);

        if (thread is null) return null;

        var customer = await _db.Users.AsNoTracking().FirstOrDefaultAsync(user => user.Id == thread.UserId);
        return thread.ToDto(customer);
    }

    public async Task<IReadOnlyList<ChatMessageDto>?> GetMessagesAsync(string threadId)
    {
        var threadExists = await _db.ChatThreads.AnyAsync(t => t.Id == threadId);
        if (!threadExists) return null;

        var messages = await _db.ChatMessages
            .AsNoTracking()
            .Where(message => message.ChatThreadId == threadId)
            .OrderBy(message => message.CreatedAt)
            .ToListAsync();

        return messages.Select(message => message.ToDto()).ToList();
    }

    public async Task<ChatThreadDto> EnsureThreadAsync(string restaurantId, string userId)
    {
        restaurantId = restaurantId.Trim();
        userId = string.IsNullOrWhiteSpace(userId) ? "shared_user" : userId.Trim();

        var existing = await _db.ChatThreads
            .Include(thread => thread.Messages)
            .FirstOrDefaultAsync(thread => thread.RestaurantId == restaurantId && thread.UserId == userId);

        if (existing is not null)
        {
            var existingCustomer = await _db.Users.AsNoTracking().FirstOrDefaultAsync(user => user.Id == existing.UserId);
            return existing.ToDto(existingCustomer);
        }

        var restaurant = await _db.Restaurants
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == restaurantId);

        if (restaurant is null)
        {
            throw new InvalidOperationException("Restaurant was not found.");
        }

        var now = DateTimeOffset.UtcNow;
        var thread = new ChatThread
        {
            Id = $"thread_{Guid.NewGuid():N}",
            RestaurantId = restaurant.Id,
            UserId = userId,
            Name = restaurant.Name,
            Avatar = restaurant.Image,
            StatusText = restaurant.ReplySpeed,
            LastMessageText = "Conversation started",
            LastMessageTime = now.ToString("O"),
            UnreadCount = 0
        };

        _db.ChatThreads.Add(thread);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            _db.ChangeTracker.Clear();
            var racedThread = await _db.ChatThreads
                .AsNoTracking()
                .Include(t => t.Messages)
                .FirstOrDefaultAsync(t => t.RestaurantId == restaurant.Id && t.UserId == userId);

            if (racedThread is not null)
            {
                var racedCustomer = await _db.Users.AsNoTracking().FirstOrDefaultAsync(user => user.Id == racedThread.UserId);
                return racedThread.ToDto(racedCustomer);
            }

            throw;
        }

        thread.Messages = new List<ChatMessage>();
        var customer = await _db.Users.AsNoTracking().FirstOrDefaultAsync(user => user.Id == userId);
        return thread.ToDto(customer);
    }

    public async Task<ChatMessageDto?> CreateTextMessageAsync(string threadId, string senderId, string content)
    {
        if (string.IsNullOrWhiteSpace(content)) return null;

        var thread = await _db.ChatThreads.FindAsync(threadId);
        if (thread is null) return null;

        var sender = ResolveSender(thread, senderId);
        var message = CreateBaseMessage(thread.Id, sender, senderId, content.Trim(), "Text", false, null);

        ApplyThreadPreview(thread, message);
        _db.ChatMessages.Add(message);
        await _db.SaveChangesAsync();

        return message.ToDto();
    }

    public async Task<ChatMessageDto?> CreateImageMessageAsync(string threadId, string senderId, string imageData, string? imageFileName)
    {
        if (string.IsNullOrWhiteSpace(imageData) || !imageData.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var thread = await _db.ChatThreads.FindAsync(threadId);
        if (thread is null) return null;

        var sender = ResolveSender(thread, senderId);
        var message = CreateBaseMessage(
            thread.Id,
            sender,
            senderId,
            "Image",
            "Image",
            false,
            null,
            imageData,
            imageFileName);

        ApplyThreadPreview(thread, message);
        _db.ChatMessages.Add(message);
        await _db.SaveChangesAsync();

        return message.ToDto();
    }

    public async Task<ChatMessageDto?> CreateDirectMessageAsync(ChatMessageCreationDto dto)
    {
        var senderId = string.IsNullOrWhiteSpace(dto.SenderId) ? dto.Sender : dto.SenderId;
        var thread = await _db.ChatThreads.FindAsync(dto.ChatThreadId);
        if (thread is null) return null;

        var isImage = string.Equals(dto.MessageType, "Image", StringComparison.OrdinalIgnoreCase);
        var message = CreateBaseMessage(
            thread.Id,
            string.IsNullOrWhiteSpace(dto.Sender) ? ResolveSender(thread, senderId) : dto.Sender,
            senderId,
            isImage ? "Image" : dto.Text.Trim(),
            isImage ? "Image" : "Text",
            false,
            null,
            isImage ? dto.ImageData : null,
            isImage ? dto.ImageFileName : null);

        ApplyThreadPreview(thread, message);
        _db.ChatMessages.Add(message);
        await _db.SaveChangesAsync();

        return message.ToDto();
    }

    public async Task<ChatMessageDto> CreateBookingMessageAsync(ChatThread thread, Booking booking)
    {
        var bookingPayload = new BookingMessageDto(
            booking.Id,
            booking.Date.ToString("yyyy-MM-dd"),
            booking.Time.ToString("HH:mm"),
            booking.Guests,
            booking.Seating,
            booking.Status);

        var text = $"Booking confirmed: {booking.Guests} guests on {bookingPayload.Date} at {bookingPayload.Time}";
        var message = CreateBaseMessage(
            thread.Id,
            "system",
            "system",
            text,
            "Booking",
            true,
            JsonSerializer.Serialize(bookingPayload),
            null,
            null);

        ApplyThreadPreview(thread, message);
        _db.ChatMessages.Add(message);
        await _db.SaveChangesAsync();

        return message.ToDto();
    }

    private static ChatMessage CreateBaseMessage(
        string threadId,
        string sender,
        string senderId,
        string text,
        string messageType,
        bool isSystemNotification,
        string? bookingPayloadJson,
        string? imageData = null,
        string? imageFileName = null)
    {
        var now = DateTimeOffset.UtcNow;
        return new ChatMessage
        {
            Id = $"msg_{Guid.NewGuid():N}",
            ChatThreadId = threadId,
            Sender = sender,
            SenderId = senderId,
            Text = text,
            Timestamp = now.ToOffset(VietnamOffset).ToString("h:mm tt"),
            Status = isSystemNotification ? null : "sent",
            MessageType = messageType,
            IsSystemNotification = isSystemNotification,
            BookingPayloadJson = bookingPayloadJson,
            ImageData = imageData,
            ImageFileName = imageFileName,
            CreatedAt = now
        };
    }

    private static void ApplyThreadPreview(ChatThread thread, ChatMessage message)
    {
        thread.LastMessageText = message.MessageType == "Booking"
            ? "Booking confirmed"
            : message.MessageType == "Image"
                ? "Image"
                : message.Text;
        thread.LastMessageTime = message.CreatedAt.ToString("O");
        thread.UnreadCount += message.Sender == "user" ? 0 : 1;
    }

    private static string ResolveSender(ChatThread thread, string senderId)
    {
        if (senderId == "system") return "system";
        return senderId == thread.UserId ? "user" : "restaurant";
    }

    private async Task<IReadOnlyDictionary<string, User>> LoadCustomersAsync(IEnumerable<string> userIds)
    {
        var ids = userIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct()
            .ToList();

        if (ids.Count == 0)
        {
            return new Dictionary<string, User>();
        }

        return await _db.Users
            .AsNoTracking()
            .Where(user => ids.Contains(user.Id))
            .ToDictionaryAsync(user => user.Id);
    }

    private static User? GetCustomer(IReadOnlyDictionary<string, User> customers, string userId) =>
        customers.TryGetValue(userId, out var customer) ? customer : null;
}
