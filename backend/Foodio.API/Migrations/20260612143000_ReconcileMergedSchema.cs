using Foodio.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Foodio.API.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260612143000_ReconcileMergedSchema")]
    public partial class ReconcileMergedSchema : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.AudioTours', 'AudioData') IS NULL
BEGIN
    ALTER TABLE dbo.AudioTours ADD AudioData NVARCHAR(MAX) NULL;
END

IF OBJECT_ID('dbo.AuditLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLogs (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AuditLogs PRIMARY KEY,
        Actor NVARCHAR(100) NOT NULL,
        Action NVARCHAR(100) NOT NULL,
        EntityType NVARCHAR(50) NOT NULL,
        EntityId NVARCHAR(64) NOT NULL,
        [Timestamp] DATETIMEOFFSET NOT NULL,
        Details NVARCHAR(2000) NULL
    );
END

IF COL_LENGTH('dbo.Bookings', 'UserId') IS NULL
BEGIN
    ALTER TABLE dbo.Bookings ADD UserId NVARCHAR(64) NOT NULL CONSTRAINT DF_Bookings_UserId DEFAULT 'usr_3';
END

IF COL_LENGTH('dbo.Bookings', 'TableNumber') IS NULL
BEGIN
    ALTER TABLE dbo.Bookings ADD TableNumber NVARCHAR(40) NULL;
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

IF COL_LENGTH('dbo.ChatThreads', 'UserId') IS NULL
BEGIN
    ALTER TABLE dbo.ChatThreads ADD UserId NVARCHAR(64) NOT NULL CONSTRAINT DF_ChatThreads_UserId DEFAULT 'usr_3';
END

IF OBJECT_ID('dbo.ChatThreads', 'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = 'IX_ChatThreads_RestaurantId_UserId'
         AND object_id = OBJECT_ID('dbo.ChatThreads')
   )
BEGIN
    CREATE UNIQUE INDEX IX_ChatThreads_RestaurantId_UserId ON dbo.ChatThreads (RestaurantId, UserId);
END

IF COL_LENGTH('dbo.CommunityPosts', 'IsRestaurantPost') IS NULL
BEGIN
    ALTER TABLE dbo.CommunityPosts ADD IsRestaurantPost BIT NOT NULL CONSTRAINT DF_CommunityPosts_IsRestaurantPost DEFAULT 0;
END

IF COL_LENGTH('dbo.CommunityPosts', 'IsApproved') IS NULL
BEGIN
    ALTER TABLE dbo.CommunityPosts ADD IsApproved BIT NOT NULL CONSTRAINT DF_CommunityPosts_IsApproved DEFAULT 0;
END

IF EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
      AND TABLE_NAME = 'CommunityPosts'
      AND COLUMN_NAME = 'Rating'
)
BEGIN
    ALTER TABLE dbo.CommunityPosts ALTER COLUMN Rating DECIMAL(4,2) NOT NULL;
END

IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Notifications PRIMARY KEY,
        UserId NVARCHAR(64) NOT NULL,
        RestaurantId NVARCHAR(64) NULL,
        [Type] NVARCHAR(50) NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Body NVARCHAR(1000) NOT NULL,
        PayloadJson NVARCHAR(2000) NULL,
        IsRead BIT NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT 0,
        CreatedAt DATETIMEOFFSET NOT NULL
    );
END

IF OBJECT_ID('dbo.PostComments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PostComments (
        Id NVARCHAR(64) NOT NULL CONSTRAINT PK_PostComments PRIMARY KEY,
        CommunityPostId NVARCHAR(64) NOT NULL,
        Author NVARCHAR(80) NOT NULL,
        Avatar NVARCHAR(1000) NOT NULL,
        Content NVARCHAR(1000) NOT NULL,
        CreatedAt DATETIMEOFFSET NOT NULL,
        CONSTRAINT FK_PostComments_CommunityPosts_CommunityPostId
            FOREIGN KEY (CommunityPostId)
            REFERENCES dbo.CommunityPosts(Id)
            ON DELETE CASCADE
    );
END

IF OBJECT_ID('dbo.PostComments', 'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = 'IX_PostComments_CommunityPostId'
         AND object_id = OBJECT_ID('dbo.PostComments')
   )
BEGIN
    CREATE INDEX IX_PostComments_CommunityPostId ON dbo.PostComments (CommunityPostId);
END

IF COL_LENGTH('dbo.Restaurants', 'Description') IS NULL
BEGIN
    ALTER TABLE dbo.Restaurants ADD Description NVARCHAR(2000) NOT NULL CONSTRAINT DF_Restaurants_Description DEFAULT '';
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

IF COL_LENGTH('dbo.Users', 'Avatar') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD Avatar NVARCHAR(MAX) NULL;
END

IF COL_LENGTH('dbo.Users', 'OwnerStatus') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD OwnerStatus NVARCHAR(32) NOT NULL CONSTRAINT DF_Users_OwnerStatus DEFAULT 'None';
END

IF COL_LENGTH('dbo.Users', 'OwnerStatus') IS NOT NULL
BEGIN
    EXEC(N'
UPDATE dbo.Users
SET OwnerStatus = ''Verified''
WHERE Role = ''Owner''
  AND RestaurantId IS NOT NULL
  AND OwnerStatus = ''None'';
');
END
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID('dbo.FK_PostComments_CommunityPosts_CommunityPostId', 'F') IS NOT NULL
BEGIN
    ALTER TABLE dbo.PostComments DROP CONSTRAINT FK_PostComments_CommunityPosts_CommunityPostId;
END

IF OBJECT_ID('dbo.PostComments', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.PostComments;
END

IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Notifications;
END

IF OBJECT_ID('dbo.AuditLogs', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.AuditLogs;
END

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_ChatThreads_RestaurantId_UserId'
      AND object_id = OBJECT_ID('dbo.ChatThreads')
)
BEGIN
    DROP INDEX IX_ChatThreads_RestaurantId_UserId ON dbo.ChatThreads;
END

IF OBJECT_ID('dbo.DF_Users_OwnerStatus', 'D') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Users DROP CONSTRAINT DF_Users_OwnerStatus;
END

IF COL_LENGTH('dbo.Users', 'OwnerStatus') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Users DROP COLUMN OwnerStatus;
END

IF COL_LENGTH('dbo.Users', 'Avatar') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Users DROP COLUMN Avatar;
END

IF OBJECT_ID('dbo.DF_Restaurants_UpdatedAt', 'D') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Restaurants DROP CONSTRAINT DF_Restaurants_UpdatedAt;
END

IF COL_LENGTH('dbo.Restaurants', 'UpdatedAt') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Restaurants DROP COLUMN UpdatedAt;
END

IF COL_LENGTH('dbo.Restaurants', 'AudioUrl') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Restaurants DROP COLUMN AudioUrl;
END

IF OBJECT_ID('dbo.DF_Restaurants_GeofenceRadiusMeters', 'D') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Restaurants DROP CONSTRAINT DF_Restaurants_GeofenceRadiusMeters;
END

IF COL_LENGTH('dbo.Restaurants', 'GeofenceRadiusMeters') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Restaurants DROP COLUMN GeofenceRadiusMeters;
END

IF OBJECT_ID('dbo.DF_Restaurants_AudioPriority', 'D') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Restaurants DROP CONSTRAINT DF_Restaurants_AudioPriority;
END

IF COL_LENGTH('dbo.Restaurants', 'AudioPriority') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Restaurants DROP COLUMN AudioPriority;
END

IF COL_LENGTH('dbo.Restaurants', 'TableStatuses') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Restaurants DROP COLUMN TableStatuses;
END

IF OBJECT_ID('dbo.DF_Restaurants_Description', 'D') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Restaurants DROP CONSTRAINT DF_Restaurants_Description;
END

IF COL_LENGTH('dbo.Restaurants', 'Description') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Restaurants DROP COLUMN Description;
END

IF OBJECT_ID('dbo.DF_CommunityPosts_IsApproved', 'D') IS NOT NULL
BEGIN
    ALTER TABLE dbo.CommunityPosts DROP CONSTRAINT DF_CommunityPosts_IsApproved;
END

IF COL_LENGTH('dbo.CommunityPosts', 'IsApproved') IS NOT NULL
BEGIN
    ALTER TABLE dbo.CommunityPosts DROP COLUMN IsApproved;
END

IF OBJECT_ID('dbo.DF_CommunityPosts_IsRestaurantPost', 'D') IS NOT NULL
BEGIN
    ALTER TABLE dbo.CommunityPosts DROP CONSTRAINT DF_CommunityPosts_IsRestaurantPost;
END

IF COL_LENGTH('dbo.CommunityPosts', 'IsRestaurantPost') IS NOT NULL
BEGIN
    ALTER TABLE dbo.CommunityPosts DROP COLUMN IsRestaurantPost;
END

IF OBJECT_ID('dbo.DF_ChatThreads_UserId', 'D') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ChatThreads DROP CONSTRAINT DF_ChatThreads_UserId;
END

IF COL_LENGTH('dbo.ChatThreads', 'UserId') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ChatThreads DROP COLUMN UserId;
END

IF COL_LENGTH('dbo.ChatMessages', 'ImageFileName') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ChatMessages DROP COLUMN ImageFileName;
END

IF COL_LENGTH('dbo.ChatMessages', 'ImageData') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ChatMessages DROP COLUMN ImageData;
END

IF COL_LENGTH('dbo.ChatMessages', 'BookingPayloadJson') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ChatMessages DROP COLUMN BookingPayloadJson;
END

IF OBJECT_ID('dbo.DF_ChatMessages_IsSystemNotification', 'D') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ChatMessages DROP CONSTRAINT DF_ChatMessages_IsSystemNotification;
END

IF COL_LENGTH('dbo.ChatMessages', 'IsSystemNotification') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ChatMessages DROP COLUMN IsSystemNotification;
END

IF OBJECT_ID('dbo.DF_ChatMessages_MessageType', 'D') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ChatMessages DROP CONSTRAINT DF_ChatMessages_MessageType;
END

IF COL_LENGTH('dbo.ChatMessages', 'MessageType') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ChatMessages DROP COLUMN MessageType;
END

IF OBJECT_ID('dbo.DF_ChatMessages_SenderId', 'D') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ChatMessages DROP CONSTRAINT DF_ChatMessages_SenderId;
END

IF COL_LENGTH('dbo.ChatMessages', 'SenderId') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ChatMessages DROP COLUMN SenderId;
END

IF COL_LENGTH('dbo.Bookings', 'TableNumber') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Bookings DROP COLUMN TableNumber;
END

IF OBJECT_ID('dbo.DF_Bookings_UserId', 'D') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Bookings DROP CONSTRAINT DF_Bookings_UserId;
END

IF COL_LENGTH('dbo.Bookings', 'UserId') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Bookings DROP COLUMN UserId;
END

IF COL_LENGTH('dbo.AudioTours', 'AudioData') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AudioTours DROP COLUMN AudioData;
END
");
        }
    }
}
