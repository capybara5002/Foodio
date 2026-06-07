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

    public static ChatMessageDto ToDto(this ChatMessage message) =>
        new(message.Id, message.Sender, message.Text, message.Timestamp, message.Status);

    public static ChatThreadDto ToDto(this ChatThread thread) =>
        new(
            thread.Id,
            thread.RestaurantId,
            thread.Name,
            thread.Avatar,
            thread.StatusText,
            thread.LastMessageText,
            thread.LastMessageTime,
            thread.UnreadCount,
            thread.Messages.OrderBy(message => message.CreatedAt).Select(message => message.ToDto()).ToList());

    public static AudioTourDto ToDto(this AudioTour tour) =>
        new(tour.Id, tour.Title, tour.Location, tour.Image, tour.MapImage, tour.IsTrending, tour.Rating, tour.Duration, tour.StopsCount, tour.Vibe, tour.Description);
}
