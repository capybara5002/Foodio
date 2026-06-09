using Foodio.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<FoodStreet> FoodStreets => Set<FoodStreet>();
    public DbSet<Restaurant> Restaurants => Set<Restaurant>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<CommunityPost> CommunityPosts => Set<CommunityPost>();
    public DbSet<ChatThread> ChatThreads => Set<ChatThread>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<AudioTour> AudioTours => Set<AudioTour>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RestaurantRequest> RestaurantRequests => Set<RestaurantRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Category>()
            .HasIndex(category => category.Slug)
            .IsUnique();

        modelBuilder.Entity<Restaurant>()
            .HasOne(restaurant => restaurant.Category)
            .WithMany(category => category.Restaurants)
            .HasForeignKey(restaurant => restaurant.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Restaurant>()
            .HasOne(restaurant => restaurant.FoodStreet)
            .WithMany(street => street.Restaurants)
            .HasForeignKey(restaurant => restaurant.FoodStreetId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MenuItem>()
            .HasOne(item => item.Restaurant)
            .WithMany(restaurant => restaurant.Dishes)
            .HasForeignKey(item => item.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Review>()
            .HasOne(review => review.Restaurant)
            .WithMany(restaurant => restaurant.Reviews)
            .HasForeignKey(review => review.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ChatThread>()
            .HasOne(thread => thread.Restaurant)
            .WithMany()
            .HasForeignKey(thread => thread.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ChatThread>()
            .HasIndex(thread => new { thread.RestaurantId, thread.UserId })
            .IsUnique();

        modelBuilder.Entity<ChatMessage>()
            .HasOne(message => message.ChatThread)
            .WithMany(thread => thread.Messages)
            .HasForeignKey(message => message.ChatThreadId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Booking>()
            .HasOne(booking => booking.Restaurant)
            .WithMany(restaurant => restaurant.Bookings)
            .HasForeignKey(booking => booking.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        Seed(modelBuilder);
    }

    private static void Seed(ModelBuilder modelBuilder)
    {
        var createdAt = new DateTimeOffset(2026, 6, 3, 0, 0, 0, TimeSpan.Zero);
        const string seafoodImage = "https://images.unsplash.com/photo-1559737558-2f5a35f4523b";
        const string phoImage = "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10";
        const string banhMiImage = "https://images.unsplash.com/photo-1608039829572-78524f79c4c7";

        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Seafood", Slug = "seafood", Icon = "waves" },
            new Category { Id = 2, Name = "Noodles", Slug = "noodles", Icon = "soup" },
            new Category { Id = 3, Name = "Street Food", Slug = "street-food", Icon = "store" },
            new Category { Id = 4, Name = "Cafe", Slug = "cafe", Icon = "coffee" });

        modelBuilder.Entity<FoodStreet>().HasData(
            new FoodStreet
            {
                Id = 1,
                Name = "Vinh Khanh Food Street",
                District = "District 4, Ho Chi Minh City",
                Description = "A dense seafood corridor known for snails, grilled shellfish, and canal-side tables.",
                CenterLatitude = 10.759245m,
                CenterLongitude = 106.706566m,
                OpeningWindow = "5:00 PM - 12:00 AM"
            },
            new FoodStreet
            {
                Id = 2,
                Name = "Pham Ngu Lao Night Bites",
                District = "District 1, Ho Chi Minh City",
                Description = "Late-night noodle shops and quick street snacks near the backpacker quarter.",
                CenterLatitude = 10.767611m,
                CenterLongitude = 106.693641m,
                OpeningWindow = "Open late"
            },
            new FoodStreet
            {
                Id = 3,
                Name = "Nguyen Trai Alley Eats",
                District = "District 1, Ho Chi Minh City",
                Description = "Small alley stalls serving seafood, banh mi, and local comfort food.",
                CenterLatitude = 10.764812m,
                CenterLongitude = 106.688938m,
                OpeningWindow = "10:00 AM - 11:00 PM"
            });

        modelBuilder.Entity<Restaurant>().HasData(
            new Restaurant
            {
                Id = "oc_dao",
                Name = "Oc Dao",
                Rating = 4.8m,
                PriceRange = "$$$",
                Distance = "1.2 km away",
                Address = "212B Alley, Nguyen Trai Street",
                Area = "District 1, Ho Chi Minh City",
                OpeningHours = "10:00 AM - 11:00 PM",
                Image = seafoodImage,
                IsVerified = true,
                ReplySpeed = "Usually replies in 5m",
                Latitude = 10.763921m,
                Longitude = 106.688515m,
                CategoryId = 1,
                FoodStreetId = 3,
                CreatedAt = createdAt
            },
            new Restaurant
            {
                Id = "oc_oanh",
                Name = "Oc Oanh",
                Rating = 4.8m,
                PriceRange = "$$",
                Distance = "0.5 km away",
                Address = "534 Vinh Khanh Street",
                Area = "District 4, Ho Chi Minh City",
                OpeningHours = "1:00 PM - 12:00 AM",
                Image = seafoodImage,
                IsVerified = true,
                ReplySpeed = "Usually replies in 5m",
                Latitude = 10.759031m,
                Longitude = 106.706962m,
                CategoryId = 1,
                FoodStreetId = 1,
                CreatedAt = createdAt
            },
            new Restaurant
            {
                Id = "pho_quynh",
                Name = "Pho Quynh",
                Rating = 4.5m,
                PriceRange = "$",
                Distance = "1.8 km away",
                Address = "323 Pham Ngu Lao",
                Area = "District 1, Ho Chi Minh City",
                OpeningHours = "Open 24/7",
                Image = phoImage,
                IsVerified = false,
                ReplySpeed = "Replies in standard hours",
                Latitude = 10.767836m,
                Longitude = 106.693385m,
                CategoryId = 2,
                FoodStreetId = 2,
                CreatedAt = createdAt
            },
            new Restaurant
            {
                Id = "banh_mi_25",
                Name = "Banh Mi 25",
                Rating = 4.6m,
                PriceRange = "$",
                Distance = "2.0 km away",
                Address = "25 Huynh Khuong Ninh",
                Area = "District 1, Ho Chi Minh City",
                OpeningHours = "7:00 AM - 9:00 PM",
                Image = banhMiImage,
                IsVerified = true,
                ReplySpeed = "Replies in 1h",
                Latitude = 10.791013m,
                Longitude = 106.695142m,
                CategoryId = 3,
                FoodStreetId = 3,
                CreatedAt = createdAt
            });

        modelBuilder.Entity<MenuItem>().HasData(
            new MenuItem { Id = "dish_1", RestaurantId = "oc_dao", Name = "Garlic Butter Crab", Price = 15.00m, Image = seafoodImage, Description = "Spicy stir-fried crab with rich garlic butter sauce.", IsAvailable = true },
            new MenuItem { Id = "dish_2", RestaurantId = "oc_dao", Name = "Grilled Oysters", Price = 12.50m, Image = seafoodImage, Description = "Fresh oysters grilled with scallion oil and toasted peanuts.", IsAvailable = true },
            new MenuItem { Id = "dish_oanh_1", RestaurantId = "oc_oanh", Name = "Spicy Tamarind Snails", Price = 8.50m, Image = seafoodImage, Description = "Sweet and sour tamarind snails with morning glory.", IsAvailable = true },
            new MenuItem { Id = "dish_pq_1", RestaurantId = "pho_quynh", Name = "Beef Pho Special", Price = 4.50m, Image = phoImage, Description = "Beef pho with rare beef, brisket, tendon, and beef balls.", IsAvailable = true },
            new MenuItem { Id = "dish_bm25_1", RestaurantId = "banh_mi_25", Name = "Original Pate Banh Mi", Price = 3.25m, Image = banhMiImage, Description = "Crisp baguette with pate, pork, herbs, pickles, and chili.", IsAvailable = true });

        modelBuilder.Entity<Review>().HasData(
            new Review { Id = "rev_1", RestaurantId = "oc_dao", Author = "Jane Doe", Role = "Local Guide", Rating = 5.0m, Avatar = "JD", Comment = "Incredible alley spot. The garlic butter sauce is perfect with bread.", CreatedAt = createdAt, ImageUrl = seafoodImage },
            new Review { Id = "rev_2", RestaurantId = "oc_dao", Author = "Alex Smith", Role = "Food Traveler", Rating = 4.0m, Avatar = "AS", Comment = "Great crab but a bit crowded. Prices are moderate.", CreatedAt = createdAt, ImageUrl = null },
            new Review { Id = "rev_3", RestaurantId = "oc_dao", Author = "Nguyen Van A", Role = "Street Food Lover", Rating = 3.0m, Avatar = "NV", Comment = "Average snails. The service is nice though.", CreatedAt = createdAt, ImageUrl = null },
            new Review { Id = "rev_oanh_1", RestaurantId = "oc_oanh", Author = "Minh Tuan", Role = "Snail aficionado", Rating = 5.0m, Avatar = "MT", Comment = "Fast service and a lively street-side seafood atmosphere.", CreatedAt = createdAt, ImageUrl = seafoodImage },
            new Review { Id = "rev_oanh_2", RestaurantId = "oc_oanh", Author = "Tran Binh", Role = "Snack critic", Rating = 4.0m, Avatar = "TB", Comment = "Lively place. Highly recommend the tamarind sauce snails.", CreatedAt = createdAt, ImageUrl = null },
            new Review { Id = "rev_pq_1", RestaurantId = "pho_quynh", Author = "An Binh", Role = "Pho lover", Rating = 4.0m, Avatar = "AB", Comment = "Open all night and very popular near Bui Vien walking street.", CreatedAt = createdAt, ImageUrl = phoImage },
            new Review { Id = "rev_pq_2", RestaurantId = "pho_quynh", Author = "John C", Role = "Backpacker", Rating = 5.0m, Avatar = "JC", Comment = "Delicious hot broth, super fresh herbs. Best late night meal!", CreatedAt = createdAt, ImageUrl = phoImage });

        modelBuilder.Entity<CommunityPost>().HasData(
            new CommunityPost { Id = "post_1", Author = "foodie_explorer", Handle = "@foodie_explorer", Avatar = seafoodImage, TimeAgo = "2 hours ago", Rating = 4.8m, Image = seafoodImage, Content = "A tiny alley stall with bold seafood flavors and a packed local crowd.", LocationName = "Oc Dao", LikesCount = 245, CommentsCount = 18, IsLiked = false, IsSaved = false, CreatedAt = createdAt },
            new CommunityPost { Id = "post_2", Author = "street_bites", Handle = "@street_bites", Avatar = phoImage, TimeAgo = "5 hours ago", Rating = 4.0m, Image = phoImage, Content = "Rich broth, springy noodles, tight seating, and the right late-night energy.", LocationName = "Pho Quynh", LikesCount = 892, CommentsCount = 45, IsLiked = true, IsSaved = false, CreatedAt = createdAt });

        modelBuilder.Entity<ChatThread>().HasData(
            new ChatThread { Id = "oc_oanh_thread", RestaurantId = "oc_oanh", UserId = "usr_3", Name = "Oc Oanh", Avatar = seafoodImage, StatusText = "Usually replies in 5m", LastMessageText = "Perfect. We will hold an outdoor table for you.", LastMessageTime = createdAt.AddMinutes(3).ToString("O"), UnreadCount = 0 },
            new ChatThread { Id = "pho_quynh_thread", RestaurantId = "pho_quynh", UserId = "usr_3", Name = "Pho Quynh", Avatar = phoImage, StatusText = "Replies in standard hours", LastMessageText = "Your reservation is confirmed!", LastMessageTime = createdAt.AddMinutes(4).ToString("O"), UnreadCount = 1 },
            new ChatThread { Id = "banh_mi_25_thread", RestaurantId = "banh_mi_25", UserId = "usr_3", Name = "Banh Mi 25", Avatar = banhMiImage, StatusText = "Replies in 1h", LastMessageText = "We are sold out for today, sorry!", LastMessageTime = createdAt.AddDays(-1).ToString("O"), UnreadCount = 0 });

        modelBuilder.Entity<ChatMessage>().HasData(
            new ChatMessage { Id = "msg_1", ChatThreadId = "oc_oanh_thread", Sender = "user", SenderId = "usr_3", Text = "Hi, do you have a table for 4 tonight around 7 PM?", Timestamp = "4:30 PM", Status = "read", MessageType = "Text", CreatedAt = createdAt },
            new ChatMessage { Id = "msg_2", ChatThreadId = "oc_oanh_thread", Sender = "restaurant", SenderId = "owner_oc_oanh", Text = "Hello! Yes, we have space. Do you prefer indoor or street-side outdoor seating?", Timestamp = "4:32 PM", Status = null, MessageType = "Text", CreatedAt = createdAt.AddMinutes(2) },
            new ChatMessage { Id = "msg_3", ChatThreadId = "oc_oanh_thread", Sender = "restaurant", SenderId = "owner_oc_oanh", Text = "Perfect. We will hold an outdoor table for you.", Timestamp = "Just now", Status = null, MessageType = "Text", CreatedAt = createdAt.AddMinutes(3) },
            new ChatMessage { Id = "msg_pq_1", ChatThreadId = "pho_quynh_thread", Sender = "system", SenderId = "system", Text = "Your reservation is confirmed!", Timestamp = "10:42 AM", Status = null, MessageType = "Text", IsSystemNotification = true, CreatedAt = createdAt.AddMinutes(4) },
            new ChatMessage { Id = "msg_bm25_1", ChatThreadId = "banh_mi_25_thread", Sender = "user", SenderId = "usr_3", Text = "Do you still have original pate banh mi?", Timestamp = "Yesterday", Status = "read", MessageType = "Text", CreatedAt = createdAt.AddDays(-1) },
            new ChatMessage { Id = "msg_bm25_2", ChatThreadId = "banh_mi_25_thread", Sender = "restaurant", SenderId = "owner_banh_mi_25", Text = "We are sold out for today, sorry!", Timestamp = "Yesterday", Status = null, MessageType = "Text", CreatedAt = createdAt.AddDays(-1).AddMinutes(2) });

        modelBuilder.Entity<AudioTour>().HasData(
            new AudioTour { Id = "tour_1", Title = "Midnight Snacking", Location = "District 1 and District 4 alleys", Image = seafoodImage, MapImage = seafoodImage, IsTrending = true, Rating = 4.9m, Duration = "2.5 hrs", StopsCount = 6, Vibe = "Energetic", Description = "A vibrant nighttime walk through seafood alleys, noodle counters, and quick snack stops." },
            new AudioTour { Id = "tour_2", Title = "Seafood Heaven Tour", Location = "Vinh Khanh Food Street", Image = seafoodImage, MapImage = seafoodImage, IsTrending = false, Rating = 4.7m, Duration = "1.5 hrs", StopsCount = 4, Vibe = "Premium", Description = "Fresh shellfish, grilled oysters, and local ordering tips from the canal-side stalls." });

        modelBuilder.Entity<User>().HasData(
            new User { Id = "usr_1", Username = "admin", Email = "admin@foodio.com", PasswordHash = "admin123", Role = "Admin", IsActive = true, CreatedAt = createdAt },
            new User { Id = "usr_2", Username = "owner_ocdao", Email = "owner@foodio.com", PasswordHash = "owner123", Role = "Owner", RestaurantId = "oc_dao", IsActive = true, CreatedAt = createdAt },
            new User { Id = "usr_3", Username = "customer", Email = "customer@foodio.com", PasswordHash = "customer123", Role = "User", IsActive = true, CreatedAt = createdAt }
        );
    }
}
