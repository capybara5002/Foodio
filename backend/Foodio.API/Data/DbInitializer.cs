using Foodio.API.Models;
using Microsoft.EntityFrameworkCore;
using BC = BCrypt.Net.BCrypt;

namespace Foodio.API.Data;

public static class DbInitializer
{
    private const string DemoPassword = "123456";

    public static async Task ApplyMigrationsAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            await context.Database.MigrateAsync();
            await EnsureChatSchemaAsync(context);
            await EnsurePaymentSchemaAsync(context);
            await EnsureDemoCatalogAsync(context);
            await EnsureDemoAudioToursAsync(context);
            await EnsureDemoCommunityAsync(context);
            await EnsureDemoUsersAsync(context);
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
                    await EnsurePaymentSchemaAsync(context);
                    await EnsureDemoCatalogAsync(context);
                    await EnsureDemoAudioToursAsync(context);
                    await EnsureDemoCommunityAsync(context);
                    await EnsureDemoUsersAsync(context);
                    await SeedDefaultDataAsync(context);
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

    private static async Task EnsureDemoCommunityAsync(AppDbContext context)
    {
        var seafoodImage = "https://images.unsplash.com/photo-1559737558-2f5a35f4523b";
        var phoImage = "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10";
        var banhMiImage = "https://images.unsplash.com/photo-1608039829572-78524f79c4c7";

        await EnsureCommunityPostAsync(
            context,
            new CommunityPost
            {
                Id = "post_1",
                Author = "foodie_explorer",
                Handle = "@foodie_explorer",
                Avatar = seafoodImage,
                TimeAgo = "2 hours ago",
                Rating = 4.8m,
                Image = seafoodImage,
                Content = "A tiny alley stall with bold seafood flavors and a packed local crowd.",
                LocationName = "Oc Dao",
                LikesCount = 245,
                CommentsCount = 2,
                IsLiked = false,
                IsSaved = false,
                IsRestaurantPost = false,
                IsApproved = true,
                CreatedAt = DateTimeOffset.UtcNow.AddHours(-2)
            });

        await EnsureCommunityPostAsync(
            context,
            new CommunityPost
            {
                Id = "post_2",
                Author = "street_bites",
                Handle = "@street_bites",
                Avatar = phoImage,
                TimeAgo = "5 hours ago",
                Rating = 4.0m,
                Image = phoImage,
                Content = "Rich broth, springy noodles, tight seating, and the right late-night energy.",
                LocationName = "Pho Quynh",
                LikesCount = 892,
                CommentsCount = 0,
                IsLiked = true,
                IsSaved = false,
                IsRestaurantPost = false,
                IsApproved = true,
                CreatedAt = DateTimeOffset.UtcNow.AddHours(-5)
            });

        await EnsureCommunityPostAsync(
            context,
            new CommunityPost
            {
                Id = "post_3",
                Author = "local_table",
                Handle = "@local_table",
                Avatar = "https://ui-avatars.com/api/?name=LT&background=2c211b&color=ffffff&size=128",
                TimeAgo = "Yesterday",
                Rating = 4.6m,
                Image = seafoodImage,
                Content = "Saved this late-night snail spot for a rainy evening. Tamarind sauce, fast service, and a street-side table with real energy.",
                LocationName = "Oc Oanh",
                LikesCount = 128,
                CommentsCount = 0,
                IsLiked = false,
                IsSaved = true,
                IsRestaurantPost = false,
                IsApproved = true,
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-1)
            });

        await EnsureCommunityPostAsync(
            context,
            new CommunityPost
            {
                Id = "post_4",
                Author = "breakfast_walk",
                Handle = "@breakfast_walk",
                Avatar = "https://ui-avatars.com/api/?name=BW&background=b76548&color=ffffff&size=128",
                TimeAgo = "This morning",
                Rating = 4.5m,
                Image = banhMiImage,
                Content = "A quick bite before the city wakes up. Crisp bread, generous herbs, and enough comfort to bookmark for another morning.",
                LocationName = "Banh Mi 25",
                LikesCount = 74,
                CommentsCount = 0,
                IsLiked = false,
                IsSaved = false,
                IsRestaurantPost = false,
                IsApproved = true,
                CreatedAt = DateTimeOffset.UtcNow.AddHours(-8)
            });

        await EnsurePostCommentAsync(
            context,
            new PostComment
            {
                Id = "pcom_1",
                CommunityPostId = "post_1",
                Author = "local_guide_jane",
                Avatar = "https://ui-avatars.com/api/?name=Jane&background=random",
                Content = "I completely agree. The snails here are excellent.",
                CreatedAt = DateTimeOffset.UtcNow.AddHours(-1.5)
            });

        await EnsurePostCommentAsync(
            context,
            new PostComment
            {
                Id = "pcom_2",
                CommunityPostId = "post_1",
                Author = "mike_eats_world",
                Avatar = "https://ui-avatars.com/api/?name=Mike&background=random",
                Content = "Is it hard to find a table on weekends?",
                CreatedAt = DateTimeOffset.UtcNow.AddHours(-1)
            });
    }

    private static async Task EnsureCommunityPostAsync(AppDbContext context, CommunityPost post)
    {
        if (await context.CommunityPosts.AnyAsync(item => item.Id == post.Id))
        {
            return;
        }

        context.CommunityPosts.Add(post);
        await context.SaveChangesAsync();
    }

    private static async Task EnsurePostCommentAsync(AppDbContext context, PostComment comment)
    {
        if (await context.PostComments.AnyAsync(item => item.Id == comment.Id))
        {
            return;
        }

        var postExists = await context.CommunityPosts.AnyAsync(item => item.Id == comment.CommunityPostId);
        if (!postExists)
        {
            return;
        }

        context.PostComments.Add(comment);
        await context.SaveChangesAsync();
    }

    private static async Task EnsureDemoAudioToursAsync(AppDbContext context)
    {
        if (await context.AudioTours.AnyAsync())
        {
            return;
        }

        var seafoodImage = "https://images.unsplash.com/photo-1559737558-2f5a35f4523b";
        context.AudioTours.AddRange(
            new AudioTour
            {
                Id = "tour_1",
                Title = "Midnight Snacking",
                Location = "District 1 and District 4 alleys",
                Image = seafoodImage,
                MapImage = seafoodImage,
                IsTrending = true,
                Rating = 4.9m,
                Duration = "2.5 hrs",
                StopsCount = 6,
                Vibe = "Energetic",
                Description = "A vibrant nighttime walk through seafood alleys, noodle counters, and quick snack stops."
            },
            new AudioTour
            {
                Id = "tour_2",
                Title = "Seafood Heaven Tour",
                Location = "Vinh Khanh Food Street",
                Image = seafoodImage,
                MapImage = seafoodImage,
                IsTrending = false,
                Rating = 4.7m,
                Duration = "1.5 hrs",
                StopsCount = 4,
                Vibe = "Premium",
                Description = "Fresh shellfish, grilled oysters, and local ordering tips from the canal-side stalls."
            });

        await context.SaveChangesAsync();
    }

    private static async Task EnsureDemoCatalogAsync(AppDbContext context)
    {
        var seafood = await EnsureCategoryAsync(context, "Seafood", "seafood", "Shell");
        var noodles = await EnsureCategoryAsync(context, "Noodles", "noodles", "BowlFood");
        var streetFood = await EnsureCategoryAsync(context, "Street Food", "street-food", "Sandwich");

        var vinhKhanh = await EnsureFoodStreetAsync(
            context,
            "Vinh Khanh Seafood Street",
            "District 4, Ho Chi Minh City",
            "Bright canal-side seafood stalls with fast service and late-night crowds.",
            10.759031m,
            106.706962m,
            "1:00 PM - 12:00 AM");

        var buiVien = await EnsureFoodStreetAsync(
            context,
            "Bui Vien Late Night Eats",
            "District 1, Ho Chi Minh City",
            "A dense late-night food corridor around Bui Vien and Pham Ngu Lao.",
            10.767836m,
            106.693385m,
            "Open 24/7");

        var nguyenTrai = await EnsureFoodStreetAsync(
            context,
            "Nguyen Trai Alley Eats",
            "District 1, Ho Chi Minh City",
            "Small alley stalls serving seafood, banh mi, and local comfort food.",
            10.764812m,
            106.688938m,
            "10:00 AM - 11:00 PM");

        await EnsureRestaurantAsync(
            context,
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
                Description = "A compact alley seafood stop known for bold snail dishes and lively local energy.",
                Image = "https://images.unsplash.com/photo-1559737558-2f5a35f4523b",
                IsVerified = true,
                ReplySpeed = "Usually replies in 5m",
                Latitude = 10.763921m,
                Longitude = 106.688515m,
                IsActive = true,
                AudioPriority = 70,
                GeofenceRadiusMeters = 35,
                CategoryId = seafood.Id,
                FoodStreetId = nguyenTrai.Id
            });

        await EnsureRestaurantAsync(
            context,
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
                Description = "A late-night seafood staple for tamarind snails, grilled shellfish, and canal-side tables.",
                Image = "https://images.unsplash.com/photo-1559737558-2f5a35f4523b",
                IsVerified = true,
                ReplySpeed = "Usually replies in 5m",
                Latitude = 10.759031m,
                Longitude = 106.706962m,
                IsActive = true,
                AudioPriority = 100,
                GeofenceRadiusMeters = 45,
                CategoryId = seafood.Id,
                FoodStreetId = vinhKhanh.Id
            });

        await EnsureRestaurantAsync(
            context,
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
                Description = "A dependable all-night pho stop near the backpacker quarter.",
                Image = "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10",
                IsVerified = false,
                ReplySpeed = "Replies in standard hours",
                Latitude = 10.767836m,
                Longitude = 106.693385m,
                IsActive = true,
                AudioPriority = 55,
                GeofenceRadiusMeters = 30,
                CategoryId = noodles.Id,
                FoodStreetId = buiVien.Id
            });

        await EnsureRestaurantAsync(
            context,
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
                Description = "A quick banh mi counter for crisp baguettes, pate, herbs, and pickles.",
                Image = "https://images.unsplash.com/photo-1608039829572-78524f79c4c7",
                IsVerified = true,
                ReplySpeed = "Replies in 1h",
                Latitude = 10.791013m,
                Longitude = 106.695142m,
                IsActive = true,
                AudioPriority = 40,
                GeofenceRadiusMeters = 30,
                CategoryId = streetFood.Id,
                FoodStreetId = nguyenTrai.Id
            });

        await EnsureMenuItemAsync(context, "dish_oc_dao_1", "oc_dao", "Garlic Butter Crab", 15.0m, "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", "Spicy crab tossed in rich garlic butter.");
        await EnsureMenuItemAsync(context, "dish_oc_oanh_1", "oc_oanh", "Spicy Tamarind Snails", 8.5m, "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", "Sweet and sour tamarind snails with morning glory.");
        await EnsureMenuItemAsync(context, "dish_pq_1", "pho_quynh", "Beef Pho Special", 4.5m, "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10", "Beef pho with rare beef, brisket, tendon, and beef balls.");
        await EnsureMenuItemAsync(context, "dish_bm25_1", "banh_mi_25", "Original Pate Banh Mi", 3.25m, "https://images.unsplash.com/photo-1608039829572-78524f79c4c7", "Crisp baguette with pate, pork, herbs, pickles, and chili.");
    }

    private static async Task<Category> EnsureCategoryAsync(AppDbContext context, string name, string slug, string icon)
    {
        var category = await context.Categories.FirstOrDefaultAsync(item => item.Slug == slug);
        if (category is not null)
        {
            return category;
        }

        category = new Category
        {
            Name = name,
            Slug = slug,
            Icon = icon
        };

        context.Categories.Add(category);
        await context.SaveChangesAsync();
        return category;
    }

    private static async Task<FoodStreet> EnsureFoodStreetAsync(
        AppDbContext context,
        string name,
        string district,
        string description,
        decimal centerLatitude,
        decimal centerLongitude,
        string openingWindow)
    {
        var street = await context.FoodStreets.FirstOrDefaultAsync(item => item.Name == name);
        if (street is not null)
        {
            return street;
        }

        street = new FoodStreet
        {
            Name = name,
            District = district,
            Description = description,
            CenterLatitude = centerLatitude,
            CenterLongitude = centerLongitude,
            OpeningWindow = openingWindow
        };

        context.FoodStreets.Add(street);
        await context.SaveChangesAsync();
        return street;
    }

    private static async Task EnsureRestaurantAsync(AppDbContext context, Restaurant demo)
    {
        var existing = await context.Restaurants.FindAsync(demo.Id);
        if (existing is not null)
        {
            return;
        }

        demo.CreatedAt = DateTimeOffset.UtcNow;
        demo.UpdatedAt = DateTimeOffset.UtcNow;
        context.Restaurants.Add(demo);
        await context.SaveChangesAsync();
    }

    private static async Task EnsureMenuItemAsync(
        AppDbContext context,
        string id,
        string restaurantId,
        string name,
        decimal price,
        string image,
        string description)
    {
        var existing = await context.MenuItems.FindAsync(id);
        if (existing is not null)
        {
            return;
        }

        context.MenuItems.Add(new MenuItem
        {
            Id = id,
            RestaurantId = restaurantId,
            Name = name,
            Price = price,
            Image = image,
            Description = description,
            IsAvailable = true
        });
        await context.SaveChangesAsync();
    }

    private static async Task EnsureDemoUsersAsync(AppDbContext context)
    {
        var demoUsers = new[]
        {
            new User
            {
                Id = "usr_1",
                Username = "admin",
                Email = "admin@foodio.com",
                Role = "Admin",
                OwnerStatus = "None",
                IsActive = true
            },
            new User
            {
                Id = "usr_2",
                Username = "owner_ocdao",
                Email = "owner@foodio.com",
                Role = "Owner",
                RestaurantId = "oc_dao",
                OwnerStatus = "Verified",
                IsActive = true
            },
            new User
            {
                Id = "usr_3",
                Username = "customer",
                Email = "customer@foodio.com",
                Role = "User",
                OwnerStatus = "None",
                IsActive = true
            },
            new User
            {
                Id = "owner_oc_oanh",
                Username = "owner_oc_oanh",
                Email = "owner_ocoanh@foodio.com",
                Role = "Owner",
                RestaurantId = "oc_oanh",
                OwnerStatus = "Verified",
                IsActive = true
            },
            new User
            {
                Id = "usr_john_doe",
                Username = "john_doe",
                Email = "john_doe@foodio.com",
                Role = "User",
                OwnerStatus = "None",
                IsActive = true
            },
            new User
            {
                Id = "usr_jane_smith",
                Username = "jane_smith",
                Email = "jane_smith@foodio.com",
                Role = "User",
                OwnerStatus = "None",
                IsActive = true
            },
            new User
            {
                Id = "usr_vietnam_eats",
                Username = "vietnam_eats",
                Email = "vietnam_eats@foodio.com",
                Role = "User",
                OwnerStatus = "None",
                IsActive = true
            }
        };

        foreach (var demoUser in demoUsers)
        {
            var existing = await context.Users.FindAsync(demoUser.Id);
            var passwordHash = BC.HashPassword(DemoPassword);

            if (existing is null)
            {
                demoUser.PasswordHash = passwordHash;
                demoUser.CreatedAt = DateTimeOffset.UtcNow;
                context.Users.Add(demoUser);
                continue;
            }

            existing.Username = demoUser.Username;
            existing.Email = demoUser.Email;
            existing.PasswordHash = passwordHash;
            existing.Role = demoUser.Role;
            existing.RestaurantId = demoUser.RestaurantId;
            existing.OwnerStatus = demoUser.OwnerStatus;
            existing.IsActive = true;
        }

        await context.SaveChangesAsync();
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

    private static async Task EnsurePaymentSchemaAsync(AppDbContext context)
    {
        await context.Database.ExecuteSqlRawAsync(@"
IF OBJECT_ID('dbo.PaymentSessions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PaymentSessions (
        Id NVARCHAR(64) NOT NULL CONSTRAINT PK_PaymentSessions PRIMARY KEY,
        ClientToken NVARCHAR(128) NOT NULL,
        AccessType NVARCHAR(32) NOT NULL,
        Amount DECIMAL(18,2) NOT NULL,
        Currency NVARCHAR(8) NOT NULL,
        Status NVARCHAR(24) NOT NULL,
        Provider NVARCHAR(32) NOT NULL,
        PaymentReference NVARCHAR(64) NOT NULL,
        QrPayload NVARCHAR(500) NOT NULL,
        CreatedAt DATETIMEOFFSET NOT NULL,
        PaidAt DATETIMEOFFSET NULL,
        ExpiresAt DATETIMEOFFSET NULL,
        LastValidatedAt DATETIMEOFFSET NULL
    );
END

IF COL_LENGTH('dbo.PaymentSessions', 'LastValidatedAt') IS NULL
BEGIN
    ALTER TABLE dbo.PaymentSessions ADD LastValidatedAt DATETIMEOFFSET NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PaymentSessions_ClientToken' AND object_id = OBJECT_ID('dbo.PaymentSessions'))
BEGIN
    CREATE UNIQUE INDEX IX_PaymentSessions_ClientToken ON dbo.PaymentSessions(ClientToken);
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PaymentSessions_ExpiresAt' AND object_id = OBJECT_ID('dbo.PaymentSessions'))
BEGIN
    CREATE INDEX IX_PaymentSessions_ExpiresAt ON dbo.PaymentSessions(ExpiresAt);
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
                },
                new User
                {
                    Id = "owner_oc_oanh",
                    Username = "owner_oc_oanh",
                    Email = "owner_ocoanh@foodio.com",
                    PasswordHash = "123456",
                    Role = "Owner",
                    IsActive = true,
                    OwnerStatus = "Verified",
                    RestaurantId = "oc_oanh",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new User
                {
                    Id = "usr_john_doe",
                    Username = "john_doe",
                    Email = "john_doe@foodio.com",
                    PasswordHash = "123456",
                    Role = "User",
                    IsActive = true,
                    OwnerStatus = "None",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new User
                {
                    Id = "usr_jane_smith",
                    Username = "jane_smith",
                    Email = "jane_smith@foodio.com",
                    PasswordHash = "123456",
                    Role = "User",
                    IsActive = true,
                    OwnerStatus = "None",
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new User
                {
                    Id = "usr_vietnam_eats",
                    Username = "vietnam_eats",
                    Email = "vietnam_eats@foodio.com",
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
