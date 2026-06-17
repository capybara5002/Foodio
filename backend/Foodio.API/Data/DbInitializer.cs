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
            await EnsureDemoUsersAsync(context);
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
                    await EnsureDemoUsersAsync(context);
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
}
