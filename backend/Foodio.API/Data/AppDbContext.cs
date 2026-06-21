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
    public DbSet<PostComment> PostComments => Set<PostComment>();
    public DbSet<ChatThread> ChatThreads => Set<ChatThread>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<AudioTour> AudioTours => Set<AudioTour>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RestaurantRequest> RestaurantRequests => Set<RestaurantRequest>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<PaymentSession> PaymentSessions => Set<PaymentSession>();

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

        modelBuilder.Entity<PostComment>()
            .HasOne(comment => comment.CommunityPost)
            .WithMany()
            .HasForeignKey(comment => comment.CommunityPostId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PaymentSession>()
            .HasIndex(session => session.ClientToken)
            .IsUnique();

        modelBuilder.Entity<PaymentSession>()
            .HasIndex(session => session.ExpiresAt);
    }
}
