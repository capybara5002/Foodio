using Foodio.API.DTOs;
using Foodio.API.Models;

namespace Foodio.API.Services;

public interface IChatService
{
    Task<IReadOnlyList<ChatThreadDto>> GetThreadsAsync(string? userId = null, string? restaurantId = null);
    Task<ChatThreadDto?> GetThreadAsync(string threadId);
    Task<IReadOnlyList<ChatMessageDto>?> GetMessagesAsync(string threadId);
    Task<ChatThreadDto> EnsureThreadAsync(string restaurantId, string userId);
    Task<ChatMessageDto?> CreateTextMessageAsync(string threadId, string senderId, string content);
    Task<ChatMessageDto?> CreateImageMessageAsync(string threadId, string senderId, string imageData, string? imageFileName);
    Task<ChatMessageDto?> CreateDirectMessageAsync(ChatMessageCreationDto dto);
    Task<ChatMessageDto> CreateBookingMessageAsync(ChatThread thread, Booking booking);
}
