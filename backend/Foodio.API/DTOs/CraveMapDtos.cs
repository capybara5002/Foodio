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
    bool IsSaved);

public record ChatMessageDto(
    string Id,
    string Sender,
    string Text,
    string Timestamp,
    string? Status);

public record ChatMessageCreationDto(
    string Sender,
    string Text,
    string ChatThreadId);

public record ChatThreadDto(
    string Id,
    string RestaurantId,
    string Name,
    string Avatar,
    string StatusText,
    string LastMessageText,
    string LastMessageTime,
    int UnreadCount,
    IReadOnlyList<ChatMessageDto> Messages);

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
    string Description);

public record BookingRequestDto(
    string RestaurantId,
    string Date,
    string Time,
    int Guests,
    string Seating);

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
    bool IsActive,
    DateTimeOffset CreatedAt);

public record UserLoginRequestDto(string Email, string Password);

public record UserRegisterRequestDto(string Username, string Email, string Password);

public record UserCreateUpdateDto(
    string Username,
    string Email,
    string Role,
    string? RestaurantId,
    string? Password,
    bool IsActive);

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
