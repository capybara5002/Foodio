using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Data;

public static class DbInitializer
{
    public static async Task ApplyMigrationsAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            await context.Database.EnsureCreatedAsync();
            await EnsureChatSchemaAsync(context);
        }
        catch (Exception ex)
        {
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

IF COL_LENGTH('dbo.CommunityPosts', 'IsRestaurantPost') IS NULL
BEGIN
    ALTER TABLE dbo.CommunityPosts ADD IsRestaurantPost BIT NOT NULL CONSTRAINT DF_CommunityPosts_IsRestaurantPost DEFAULT 0;
END

IF OBJECT_ID(N'dbo.PostComments', N'U') IS NULL AND OBJECT_ID(N'dbo.CommunityPosts', N'U') IS NOT NULL
BEGIN
    CREATE TABLE dbo.PostComments
    (
        Id NVARCHAR(64) NOT NULL CONSTRAINT PK_PostComments PRIMARY KEY,
        CommunityPostId NVARCHAR(64) NOT NULL,
        Author NVARCHAR(80) NOT NULL,
        Avatar NVARCHAR(1000) NOT NULL,
        Content NVARCHAR(1000) NOT NULL,
        CreatedAt DATETIMEOFFSET NOT NULL,
        CONSTRAINT FK_PostComments_CommunityPosts FOREIGN KEY (CommunityPostId) REFERENCES dbo.CommunityPosts(Id) ON DELETE CASCADE
    );
END

IF OBJECT_ID(N'dbo.RestaurantRequests', N'U') IS NULL
   AND OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Categories', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.FoodStreets', N'U') IS NOT NULL
BEGIN
    CREATE TABLE dbo.RestaurantRequests
    (
        Id NVARCHAR(64) NOT NULL CONSTRAINT PK_RestaurantRequests PRIMARY KEY,
        OwnerId NVARCHAR(64) NOT NULL,
        Name NVARCHAR(160) NOT NULL,
        PriceRange NVARCHAR(8) NOT NULL,
        CategoryId INT NOT NULL,
        FoodStreetId INT NOT NULL,
        Distance NVARCHAR(64) NOT NULL,
        Address NVARCHAR(240) NOT NULL,
        Area NVARCHAR(120) NOT NULL,
        OpeningHours NVARCHAR(80) NOT NULL,
        Image NVARCHAR(1000) NOT NULL,
        Latitude DECIMAL(9,6) NOT NULL,
        Longitude DECIMAL(9,6) NOT NULL,
        Status NVARCHAR(16) NOT NULL CONSTRAINT DF_RestaurantRequests_Status DEFAULT 'Pending',
        AdminNote NVARCHAR(500) NULL,
        CreatedAt DATETIMEOFFSET NOT NULL,
        ReviewedAt DATETIMEOFFSET NULL,
        CONSTRAINT FK_RestaurantRequests_Users_OwnerId FOREIGN KEY (OwnerId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
        CONSTRAINT FK_RestaurantRequests_Categories_CategoryId FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_RestaurantRequests_FoodStreets_FoodStreetId FOREIGN KEY (FoodStreetId) REFERENCES dbo.FoodStreets(Id) ON DELETE NO ACTION
    );

    CREATE INDEX IX_RestaurantRequests_OwnerId ON dbo.RestaurantRequests(OwnerId);
    CREATE INDEX IX_RestaurantRequests_CategoryId ON dbo.RestaurantRequests(CategoryId);
    CREATE INDEX IX_RestaurantRequests_FoodStreetId ON dbo.RestaurantRequests(FoodStreetId);
END
");
    }
}
