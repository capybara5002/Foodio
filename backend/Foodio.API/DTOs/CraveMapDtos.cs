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
    string Avatar);

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
