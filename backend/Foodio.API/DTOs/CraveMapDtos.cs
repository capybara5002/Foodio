namespace Foodio.API.DTOs;

public record CategoryDto(int Id, string Name, string Slug, string? Icon);

public record FoodStreetDto(
    int Id,
    string Name,
    string District,
    string Description,
    decimal CenterLatitude,
    decimal CenterLongitude,
    string OpeningWindow);

public record DishDto(
    string Id,
    string Name,
    decimal Price,
    string Image,
    string? Description);

public record FoodieReviewDto(
    string Id,
    string Author,
    string Role,
    decimal Rating,
    string Comment,
    string Avatar,
    string? ImageUrl);

public record RestaurantDto(
    string Id,
    string Name,
    decimal Rating,
    string PriceRange,
    string Category,
    string Distance,
    string Address,
    string Area,
    string OpeningHours,
    string Description,
    string? TableStatuses,
    string Image,
    bool IsVerified,
    string ReplySpeed,
    decimal Latitude,
    decimal Longitude,
    int CategoryId,
    int FoodStreetId,
    IReadOnlyList<DishDto> Dishes,
    IReadOnlyList<FoodieReviewDto> Reviews);

public record RestaurantUpsertDto(
    string Name,
    decimal Rating,
    string PriceRange,
    int CategoryId,
    int FoodStreetId,
    string Distance,
    string Address,
    string Area,
    string OpeningHours,
    string Description,
    string? TableStatuses,
    string Image,
    bool IsVerified,
    string ReplySpeed,
    decimal Latitude,
    decimal Longitude,
    bool IsActive = true);

public record CommunityPostDto(
    string Id,
    string Author,
    string Handle,
    string Avatar,
    string TimeAgo,
    decimal Rating,
    string Image,
    string Content,
    string LocationName,
    int LikesCount,
    int CommentsCount,
    bool IsLiked,
    bool IsSaved,
    bool IsRestaurantPost = false,
    bool IsApproved = false);

public record ChatMessageDto(
    string Id,
    string ChatThreadId,
    string Sender,
    string SenderId,
    string Text,
    string Timestamp,
    string? Status,
    string MessageType,
    bool IsSystemNotification,
    BookingMessageDto? Booking,
    string? ImageData,
    string? ImageFileName,
    DateTimeOffset CreatedAt);

public record ChatMessageCreationDto(
    string Sender,
    string Text,
    string ChatThreadId,
    string? SenderId = null,
    string? MessageType = null,
    string? ImageData = null,
    string? ImageFileName = null);

public record ChatThreadDto(
    string Id,
    string RestaurantId,
    string UserId,
    string Name,
    string Avatar,
    string CustomerName,
    string CustomerAvatar,
    string StatusText,
    string LastMessageText,
    string LastMessageTime,
    int UnreadCount,
    IReadOnlyList<ChatMessageDto> Messages);

public record EnsureChatThreadDto(string RestaurantId, string UserId);

public record BookingMessageDto(
    int BookingId,
    string Date,
    string Time,
    int Guests,
    string Seating,
    string Status);

public record AudioTourDto(
    string Id,
    string Title,
    string Location,
    string Image,
    string MapImage,
    bool IsTrending,
    decimal Rating,
    string Duration,
    int StopsCount,
    string Vibe,
    string Description,
    string? AudioData = null);

public record BookingRequestDto(
    string RestaurantId,
    string Date,
    string Time,
    int Guests,
    string Seating,
    string? UserId = null);

public record BookingDto(
    int Id,
    string RestaurantId,
    DateOnly Date,
    TimeOnly Time,
    int Guests,
    string Seating,
    string Status);

public record UserDto(
    string Id,
    string Username,
    string Email,
    string Role,
    string? RestaurantId,
    string OwnerStatus,
    bool IsActive,
    DateTimeOffset CreatedAt,
    string? Avatar);

public record UserLoginRequestDto(string Email, string Password);

public record UserRegisterRequestDto(string Username, string Email, string Password);

public record UpdatePasswordRequestDto(string Email, string CurrentPassword, string NewPassword);

public record UpdateAvatarRequestDto(string Email, string Avatar);

public record UserCreateUpdateDto(
    string Username,
    string Email,
    string Role,
    string? RestaurantId,
    string OwnerStatus,
    string? Password,
    bool IsActive);

public record NotificationDto(
    int Id,
    string UserId,
    string? RestaurantId,
    string Type,
    string Title,
    string Body,
    string? PayloadJson,
    bool IsRead,
    DateTimeOffset CreatedAt);

public record AuditLogDto(
    int Id,
    string Actor,
    string Action,
    string EntityType,
    string EntityId,
    DateTimeOffset Timestamp,
    string? Details);

public record QrGenerateRequestDto(string RestaurantId, int TableNumber);

public record QrVerifyRequestDto(string Token);

public record QrVerifyResponseDto(
    string RestaurantId,
    string RestaurantName,
    int TableNumber,
    string Token);

public record RestaurantRequestCreateDto(
    string Name,
    string PriceRange,
    int CategoryId,
    int FoodStreetId,
    string Distance,
    string Address,
    string Area,
    string OpeningHours,
    string Image,
    decimal Latitude,
    decimal Longitude);

public record RestaurantRequestDto(
    string Id,
    string OwnerId,
    string OwnerName,
    string OwnerEmail,
    string Name,
    string PriceRange,
    string CategoryName,
    string FoodStreetName,
    string Distance,
    string Address,
    string Area,
    string OpeningHours,
    string Image,
    decimal Latitude,
    decimal Longitude,
    string Status,
    string? AdminNote,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ReviewedAt);

public record RestaurantRequestReviewDto(string? AdminNote);
