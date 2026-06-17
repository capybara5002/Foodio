using Microsoft.EntityFrameworkCore;
using Foodio.API.Models;

namespace Foodio.API.Data;

public static class DbInitializer
{
    public static async Task ApplyMigrationsAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            await context.Database.MigrateAsync();
            await EnsureChatSchemaAsync(context);
            await SeedDefaultDataAsync(context);
            await context.Users.AnyAsync();
            await context.PostComments.AnyAsync();
        }
        catch (Exception ex)
        {
            // Auto-heal: If migrations fail due to table/migration conflicts in local dev database, drop & recreate cleanly.
            if (ex.ToString().Contains("already an object named") || ex.ToString().Contains("Invalid object name") || ex.ToString().Contains("2714") || ex.ToString().Contains("208"))
            {
                try
                {
                    await context.Database.EnsureDeletedAsync();
                    await context.Database.MigrateAsync();
                    await EnsureChatSchemaAsync(context);
                    await context.Users.AnyAsync();
                    await context.PostComments.AnyAsync();
                    return;
                }
                catch (Exception healEx)
                {
                    throw new InvalidOperationException(
                        "Failed to auto-heal database. Manual DB drop might be required.",
                        healEx);
                }
            }

            throw new InvalidOperationException(
                "Could not initialize the SQL Server database. Check ConnectionStrings:DefaultConnection in appsettings.Development.json or appsettings.json.",
                ex);
        }
    }

    private static async Task EnsureChatSchemaAsync(AppDbContext context)
    {
        await context.Database.ExecuteSqlRawAsync(@"
IF COL_LENGTH('dbo.Users', 'Avatar') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD Avatar NVARCHAR(2000) NULL;
END

IF COL_LENGTH('dbo.ChatThreads', 'UserId') IS NULL
BEGIN
    ALTER TABLE dbo.ChatThreads ADD UserId NVARCHAR(64) NOT NULL CONSTRAINT DF_ChatThreads_UserId DEFAULT 'usr_3';
END

IF COL_LENGTH('dbo.ChatMessages', 'SenderId') IS NULL
BEGIN
    ALTER TABLE dbo.ChatMessages ADD SenderId NVARCHAR(64) NOT NULL CONSTRAINT DF_ChatMessages_SenderId DEFAULT '';
END

IF COL_LENGTH('dbo.ChatMessages', 'MessageType') IS NULL
BEGIN
    ALTER TABLE dbo.ChatMessages ADD MessageType NVARCHAR(24) NOT NULL CONSTRAINT DF_ChatMessages_MessageType DEFAULT 'Text';
END

IF COL_LENGTH('dbo.ChatMessages', 'IsSystemNotification') IS NULL
BEGIN
    ALTER TABLE dbo.ChatMessages ADD IsSystemNotification BIT NOT NULL CONSTRAINT DF_ChatMessages_IsSystemNotification DEFAULT 0;
END

IF COL_LENGTH('dbo.ChatMessages', 'BookingPayloadJson') IS NULL
BEGIN
    ALTER TABLE dbo.ChatMessages ADD BookingPayloadJson NVARCHAR(2000) NULL;
END

IF COL_LENGTH('dbo.ChatMessages', 'ImageData') IS NULL
BEGIN
    ALTER TABLE dbo.ChatMessages ADD ImageData NVARCHAR(MAX) NULL;
END

IF COL_LENGTH('dbo.ChatMessages', 'ImageFileName') IS NULL
BEGIN
    ALTER TABLE dbo.ChatMessages ADD ImageFileName NVARCHAR(260) NULL;
END

IF COL_LENGTH('dbo.Restaurants', 'Description') IS NULL
BEGIN
    ALTER TABLE dbo.Restaurants ADD Description NVARCHAR(MAX) NOT NULL DEFAULT '';
END

IF COL_LENGTH('dbo.Restaurants', 'TableStatuses') IS NULL
BEGIN
    ALTER TABLE dbo.Restaurants ADD TableStatuses NVARCHAR(MAX) NULL;
END

IF COL_LENGTH('dbo.Restaurants', 'AudioPriority') IS NULL
BEGIN
    ALTER TABLE dbo.Restaurants ADD AudioPriority INT NOT NULL CONSTRAINT DF_Restaurants_AudioPriority DEFAULT 0;
END

IF COL_LENGTH('dbo.Restaurants', 'GeofenceRadiusMeters') IS NULL
BEGIN
    ALTER TABLE dbo.Restaurants ADD GeofenceRadiusMeters INT NOT NULL CONSTRAINT DF_Restaurants_GeofenceRadiusMeters DEFAULT 30;
END

IF COL_LENGTH('dbo.Restaurants', 'AudioUrl') IS NULL
BEGIN
    ALTER TABLE dbo.Restaurants ADD AudioUrl NVARCHAR(500) NULL;
END

IF COL_LENGTH('dbo.Restaurants', 'UpdatedAt') IS NULL
BEGIN
    ALTER TABLE dbo.Restaurants ADD UpdatedAt DATETIMEOFFSET NOT NULL CONSTRAINT DF_Restaurants_UpdatedAt DEFAULT SYSDATETIMEOFFSET();
END

IF COL_LENGTH('dbo.CommunityPosts', 'IsRestaurantPost') IS NULL
BEGIN
    ALTER TABLE dbo.CommunityPosts ADD IsRestaurantPost BIT NOT NULL CONSTRAINT DF_CommunityPosts_IsRestaurantPost DEFAULT 0;
END

IF COL_LENGTH('dbo.AudioTours', 'AudioData') IS NULL
BEGIN
    ALTER TABLE dbo.AudioTours ADD AudioData NVARCHAR(MAX) NULL;
END

IF COL_LENGTH('dbo.CommunityPosts', 'IsApproved') IS NULL
BEGIN
    ALTER TABLE dbo.CommunityPosts ADD IsApproved BIT NOT NULL CONSTRAINT DF_CommunityPosts_IsApproved DEFAULT 1;
END

IF COL_LENGTH('dbo.Users', 'OwnerStatus') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD OwnerStatus NVARCHAR(32) NOT NULL CONSTRAINT DF_Users_OwnerStatus DEFAULT 'None';
END

UPDATE dbo.Users
SET OwnerStatus = 'Verified'
WHERE Role = 'Owner'
  AND RestaurantId IS NOT NULL
  AND (OwnerStatus IS NULL OR OwnerStatus = 'None');

IF COL_LENGTH('dbo.Bookings', 'UserId') IS NULL
BEGIN
    ALTER TABLE dbo.Bookings ADD UserId NVARCHAR(64) NOT NULL CONSTRAINT DF_Bookings_UserId DEFAULT 'usr_3';
END

IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId NVARCHAR(64) NOT NULL,
        RestaurantId NVARCHAR(64) NULL,
        Type NVARCHAR(50) NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Body NVARCHAR(1000) NOT NULL,
        PayloadJson NVARCHAR(2000) NULL,
        IsRead BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIMEOFFSET NOT NULL
    );
END

IF OBJECT_ID('dbo.AuditLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLogs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Actor NVARCHAR(100) NOT NULL,
        Action NVARCHAR(100) NOT NULL,
        EntityType NVARCHAR(50) NOT NULL,
        EntityId NVARCHAR(64) NOT NULL,
        Timestamp DATETIMEOFFSET NOT NULL,
        Details NVARCHAR(2000) NULL
    );
END

IF OBJECT_ID('dbo.PostComments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PostComments (
        Id NVARCHAR(64) PRIMARY KEY,
        CommunityPostId NVARCHAR(64) NOT NULL,
        Author NVARCHAR(80) NOT NULL,
        Avatar NVARCHAR(1000) NOT NULL,
        Content NVARCHAR(1000) NOT NULL,
        CreatedAt DATETIMEOFFSET NOT NULL,
        CONSTRAINT FK_PostComments_CommunityPosts_CommunityPostId FOREIGN KEY (CommunityPostId) REFERENCES dbo.CommunityPosts(Id) ON DELETE CASCADE
    );
END

-- Fix CommunityPosts.Rating precision (was decimal(3,2) which only allows up to 9.99)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CommunityPosts' AND COLUMN_NAME = 'Rating')
BEGIN
    ALTER TABLE dbo.CommunityPosts ALTER COLUMN Rating DECIMAL(4,2) NOT NULL;
END

-- Add TableNumber column to Bookings for table selection feature
IF COL_LENGTH('dbo.Bookings', 'TableNumber') IS NULL
BEGIN
    ALTER TABLE dbo.Bookings ADD TableNumber NVARCHAR(40) NULL;
END
");
    }

    private static async Task SeedDefaultDataAsync(AppDbContext context)
    {
        // 1. Seed Restaurants
        if (!await context.Restaurants.AnyAsync())
        {
            var restaurants = new List<Restaurant>
            {
                new Restaurant
                {
                    Id = "banh_mi_25",
                    Name = "Banh Mi 25",
                    Rating = 4.6m,
                    PriceRange = "$",
                    CategoryId = 3,
                    FoodStreetId = 3,
                    Distance = "2.0 km away",
                    Address = "25 Huynh Khuong Ninh",
                    Area = "District 1, Ho Chi Minh City",
                    OpeningHours = "7:00 AM - 9:00 PM",
                    Description = "Delicious crispy banh mi with traditional fillings.",
                    Image = "https://images.unsplash.com/photo-1608039829572-78524f79c4c7",
                    IsVerified = true,
                    ReplySpeed = "Replies in 1h",
                    Latitude = 10.791013m,
                    Longitude = 106.695142m,
                    IsActive = true,
                    AudioPriority = 40,
                    GeofenceRadiusMeters = 30,
                    UpdatedAt = DateTimeOffset.UtcNow
                },
                new Restaurant
                {
                    Id = "oc_dao",
                    Name = "Oc Dao",
                    Rating = 4.8m,
                    PriceRange = "$$$",
                    CategoryId = 1,
                    FoodStreetId = 3,
                    Distance = "1.2 km away",
                    Address = "212B Alley, Nguyen Trai Street",
                    Area = "District 1, Ho Chi Minh City",
                    OpeningHours = "10:00 AM - 11:00 PM",
                    Description = "Famous snail street stall with rich flavorful options.",
                    Image = "https://images.unsplash.com/photo-1559737558-2f5a35f4523b",
                    IsVerified = true,
                    ReplySpeed = "Usually replies in 5m",
                    Latitude = 10.763921m,
                    Longitude = 106.688515m,
                    IsActive = true,
                    AudioPriority = 70,
                    GeofenceRadiusMeters = 35,
                    UpdatedAt = DateTimeOffset.UtcNow
                },
                new Restaurant
                {
                    Id = "oc_oanh",
                    Name = "Oc Oanh",
                    Rating = 4.8m,
                    PriceRange = "$$",
                    CategoryId = 1,
                    FoodStreetId = 1,
                    Distance = "0.5 km away",
                    Address = "534 Vinh Khanh Street",
                    Area = "District 4, Ho Chi Minh City",
                    OpeningHours = "1:00 PM - 12:00 AM",
                    Description = "Vibrant local snail street food hotspot on Vinh Khanh.",
                    Image = "https://images.unsplash.com/photo-1559737558-2f5a35f4523b",
                    IsVerified = true,
                    ReplySpeed = "Usually replies in 5m",
                    Latitude = 10.759031m,
                    Longitude = 106.706962m,
                    IsActive = true,
                    AudioPriority = 100,
                    GeofenceRadiusMeters = 45,
                    UpdatedAt = DateTimeOffset.UtcNow
                },
                new Restaurant
                {
                    Id = "pho_quynh",
                    Name = "Pho Quynh",
                    Rating = 4.5m,
                    PriceRange = "$",
                    CategoryId = 2,
                    FoodStreetId = 2,
                    Distance = "1.8 km away",
                    Address = "323 Pham Ngu Lao",
                    Area = "District 1, Ho Chi Minh City",
                    OpeningHours = "Open 24/7",
                    Description = "Authentic traditional beef noodle soup open all night.",
                    Image = "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10",
                    IsVerified = false,
                    ReplySpeed = "Replies in standard hours",
                    Latitude = 10.767836m,
                    Longitude = 106.693385m,
                    IsActive = true,
                    AudioPriority = 55,
                    GeofenceRadiusMeters = 30,
                    UpdatedAt = DateTimeOffset.UtcNow
                }
            };
            await context.Restaurants.AddRangeAsync(restaurants);
            await context.SaveChangesAsync();
        }

        // 2. Seed MenuItems (Dishes)
        if (!await context.MenuItems.AnyAsync())
        {
            var dishes = new List<MenuItem>
            {
                new MenuItem
                {
                    Id = "dish_1",
                    Name = "Garlic Butter Crab",
                    Price = 15.00m,
                    Description = "Spicy stir-fried crab with rich garlic butter sauce.",
                    Image = "https://images.unsplash.com/photo-1559737558-2f5a35f4523b",
                    RestaurantId = "oc_dao",
                    IsAvailable = true
                },
                new MenuItem
                {
                    Id = "dish_2",
                    Name = "Grilled Oysters",
                    Price = 12.50m,
                    Description = "Fresh oysters grilled with scallion oil and toasted peanuts.",
                    Image = "https://images.unsplash.com/photo-1559737558-2f5a35f4523b",
                    RestaurantId = "oc_dao",
                    IsAvailable = true
                },
                new MenuItem
                {
                    Id = "dish_bm25_1",
                    Name = "Original Pate Banh Mi",
                    Price = 3.25m,
                    Description = "Crisp baguette with pate, pork, herbs, pickles, and chili.",
                    Image = "https://images.unsplash.com/photo-1608039829572-78524f79c4c7",
                    RestaurantId = "banh_mi_25",
                    IsAvailable = true
                },
                new MenuItem
                {
                    Id = "dish_oanh_1",
                    Name = "Spicy Tamarind Snails",
                    Price = 8.50m,
                    Description = "Sweet and sour tamarind snails with morning glory.",
                    Image = "https://images.unsplash.com/photo-1559737558-2f5a35f4523b",
                    RestaurantId = "oc_oanh",
                    IsAvailable = true
                },
                new MenuItem
                {
                    Id = "dish_pq_1",
                    Name = "Beef Pho Special",
                    Price = 4.50m,
                    Description = "Beef pho with rare beef, brisket, tendon, and beef balls.",
                    Image = "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10",
                    RestaurantId = "pho_quynh",
                    IsAvailable = true
                }
            };
            await context.MenuItems.AddRangeAsync(dishes);
            await context.SaveChangesAsync();
        }

        // 3. Seed Users
        if (!await context.Users.AnyAsync(u => u.Id == "usr_1" || u.Id == "usr_2" || u.Id == "usr_3"))
        {
            var users = new List<User>
            {
                new User
                {
                    Id = "usr_1",
                    Username = "admin",
                    Email = "admin@foodio.com",
                    PasswordHash = "123456",
                    Role = "Admin",
                    IsActive = true,
                    OwnerStatus = "None",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new User
                {
                    Id = "usr_2",
                    Username = "owner_ocdao",
                    Email = "owner@foodio.com",
                    PasswordHash = "123456",
                    Role = "Owner",
                    IsActive = true,
                    OwnerStatus = "Verified",
                    RestaurantId = "oc_dao",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new User
                {
                    Id = "usr_3",
                    Username = "customer",
                    Email = "customer@foodio.com",
                    PasswordHash = "123456",
                    Role = "User",
                    IsActive = true,
                    OwnerStatus = "None",
                    CreatedAt = DateTimeOffset.UtcNow
                }
            };

            foreach (var u in users)
            {
                var existingUser = await context.Users.FindAsync(u.Id);
                if (existingUser == null)
                {
                    await context.Users.AddAsync(u);
                }
            }
            await context.SaveChangesAsync();
        }

        // 4. Seed Reviews
        if (!await context.Reviews.AnyAsync())
        {
            var reviews = new List<Review>
            {
                new Review
                {
                    Id = "rev_1",
                    Author = "john_doe",
                    Role = "Local Guide",
                    Rating = 5.0m,
                    Comment = "Excellent food and outstanding customer service. Highly recommended!",
                    Avatar = "JD",
                    RestaurantId = "oc_dao",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-10)
                },
                new Review
                {
                    Id = "rev_2",
                    Author = "jane_smith",
                    Role = "Food Blogger",
                    Rating = 4.0m,
                    Comment = "Great street side seating and delicious snails. Tamarind sauce is a must-try.",
                    Avatar = "JS",
                    RestaurantId = "oc_oanh",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-5)
                },
                new Review
                {
                    Id = "rev_3",
                    Author = "vietnam_eats",
                    Role = "Pho Enthusiast",
                    Rating = 4.5m,
                    Comment = "Best late night pho quynh in the district. Rich broth and fresh herbs.",
                    Avatar = "VE",
                    RestaurantId = "pho_quynh",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-2)
                }
            };
            await context.Reviews.AddRangeAsync(reviews);
            await context.SaveChangesAsync();
        }

        // 5. Seed ChatThreads & ChatMessages
        if (!await context.ChatThreads.AnyAsync())
        {
            var threads = new List<ChatThread>
            {
                new ChatThread
                {
                    Id = "oc_oanh_thread",
                    RestaurantId = "oc_oanh",
                    UserId = "usr_3",
                    Name = "Oc Oanh",
                    Avatar = "https://images.unsplash.com/photo-1559737558-2f5a35f4523b",
                    StatusText = "Usually replies in 5m",
                    LastMessageText = "Perfect. We will hold an outdoor table for you.",
                    LastMessageTime = DateTimeOffset.UtcNow.ToString("O"),
                    UnreadCount = 0
                },
                new ChatThread
                {
                    Id = "pho_quynh_thread",
                    RestaurantId = "pho_quynh",
                    UserId = "usr_3",
                    Name = "Pho Quynh",
                    Avatar = "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10",
                    StatusText = "Replies in standard hours",
                    LastMessageText = "Your reservation is confirmed!",
                    LastMessageTime = DateTimeOffset.UtcNow.ToString("O"),
                    UnreadCount = 0
                }
            };
            await context.ChatThreads.AddRangeAsync(threads);
            await context.SaveChangesAsync();

            var messages = new List<ChatMessage>
            {
                new ChatMessage
                {
                    Id = "msg_1",
                    ChatThreadId = "oc_oanh_thread",
                    Sender = "user",
                    SenderId = "usr_3",
                    Text = "Hi, do you have a table for 4 tonight around 7 PM?",
                    Timestamp = "4:30 PM",
                    MessageType = "Text",
                    IsSystemNotification = false,
                    CreatedAt = DateTimeOffset.UtcNow.AddHours(-1)
                },
                new ChatMessage
                {
                    Id = "msg_2",
                    ChatThreadId = "oc_oanh_thread",
                    Sender = "restaurant",
                    SenderId = "owner_oc_oanh",
                    Text = "Hello! Yes, we have space. Do you prefer indoor or street-side outdoor seating?",
                    Timestamp = "4:32 PM",
                    MessageType = "Text",
                    IsSystemNotification = false,
                    CreatedAt = DateTimeOffset.UtcNow.AddHours(-1).AddMinutes(2)
                },
                new ChatMessage
                {
                    Id = "msg_3",
                    ChatThreadId = "oc_oanh_thread",
                    Sender = "restaurant",
                    SenderId = "owner_oc_oanh",
                    Text = "Perfect. We will hold an outdoor table for you.",
                    Timestamp = "4:35 PM",
                    MessageType = "Text",
                    IsSystemNotification = false,
                    CreatedAt = DateTimeOffset.UtcNow.AddHours(-1).AddMinutes(5)
                },
                new ChatMessage
                {
                    Id = "msg_pq_1",
                    ChatThreadId = "pho_quynh_thread",
                    Sender = "system",
                    SenderId = "system",
                    Text = "Your reservation is confirmed!",
                    Timestamp = "10:42 AM",
                    MessageType = "Text",
                    IsSystemNotification = true,
                    CreatedAt = DateTimeOffset.UtcNow.AddHours(-2)
                }
            };
            await context.ChatMessages.AddRangeAsync(messages);
            await context.SaveChangesAsync();
        }
    }
}
