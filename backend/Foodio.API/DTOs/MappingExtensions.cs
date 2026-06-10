using System.Text.Json;
using Foodio.API.Models;

namespace Foodio.API.DTOs;

public static class MappingExtensions
{
    public static CategoryDto ToDto(this Category category) =>
        new(category.Id, category.Name, category.Slug, category.Icon);

    public static FoodStreetDto ToDto(this FoodStreet street) =>
        new(street.Id, street.Name, street.District, street.Description, street.CenterLatitude, street.CenterLongitude, street.OpeningWindow);

    public static DishDto ToDto(this MenuItem dish) =>
        new(dish.Id, dish.Name, dish.Price, dish.Image, dish.Description);

    public static FoodieReviewDto ToDto(this Review review) =>
        new(review.Id, review.Author, review.Role, review.Rating, review.Comment, review.Avatar, review.ImageUrl);

    public static UserDto ToDto(this User user) =>
        new(user.Id, user.Username, user.Email, user.Role, user.RestaurantId, user.IsActive, user.CreatedAt);

    public static RestaurantDto ToDto(this Restaurant restaurant) =>
        new(
            restaurant.Id,
            restaurant.Name,
            restaurant.Rating,
            restaurant.PriceRange,
            restaurant.Category?.Name ?? string.Empty,
            restaurant.Distance,
            restaurant.Address,
            restaurant.Area,
            restaurant.OpeningHours,
            restaurant.Image,
            restaurant.IsVerified,
            restaurant.ReplySpeed,
            restaurant.Latitude,
            restaurant.Longitude,
            restaurant.CategoryId,
            restaurant.FoodStreetId,
            restaurant.Dishes.OrderBy(dish => dish.Name).Select(dish => dish.ToDto()).ToList(),
            restaurant.Reviews.OrderByDescending(review => review.CreatedAt).Select(review => review.ToDto()).ToList());

    public static CommunityPostDto ToDto(this CommunityPost post) =>
        new(post.Id, post.Author, post.Handle, post.Avatar, post.TimeAgo, post.Rating, post.Image, post.Content, post.LocationName, post.LikesCount, post.CommentsCount, post.IsLiked, post.IsSaved);

    public static PostCommentDto ToDto(this PostComment comment) =>
        new(comment.Id, comment.CommunityPostId, comment.Author, comment.Avatar, comment.Content, comment.CreatedAt);

    public static ChatMessageDto ToDto(this ChatMessage message) =>
        new(
            message.Id,
            message.ChatThreadId,
            message.Sender,
            message.SenderId,
            message.Text,
            message.Timestamp,
            message.Status,
            message.MessageType,
            message.IsSystemNotification,
            string.IsNullOrWhiteSpace(message.BookingPayloadJson)
                ? null
                : JsonSerializer.Deserialize<BookingMessageDto>(message.BookingPayloadJson),
            message.ImageData,
            message.ImageFileName,
            message.CreatedAt);

    public static ChatThreadDto ToDto(this ChatThread thread, User? customer = null) =>
        new(
            thread.Id,
            thread.RestaurantId,
            thread.UserId,
            thread.Name,
            thread.Avatar,
            customer?.Username ?? thread.UserId,
            BuildCustomerAvatar(customer?.Username ?? thread.UserId),
            thread.StatusText,
            thread.LastMessageText,
            thread.LastMessageTime,
            thread.UnreadCount,
            thread.Messages.OrderBy(message => message.CreatedAt).Select(message => message.ToDto()).ToList());

    private static string BuildCustomerAvatar(string name) =>
        $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(name)}&background=1a1a1a&color=ffffff&size=128";

    public static AudioTourDto ToDto(this AudioTour tour) =>
        new(tour.Id, tour.Title, tour.Location, tour.Image, tour.MapImage, tour.IsTrending, tour.Rating, tour.Duration, tour.StopsCount, tour.Vibe, tour.Description);

    public static BookingDto ToDto(this Booking booking) =>
        new(booking.Id, booking.RestaurantId, booking.Date, booking.Time, booking.Guests, booking.Seating, booking.Status);
}
