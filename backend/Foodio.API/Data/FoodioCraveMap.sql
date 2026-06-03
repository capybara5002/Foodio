IF DB_ID(N'FoodioCraveMapDb') IS NULL
BEGIN
    CREATE DATABASE FoodioCraveMapDb;
END
GO

USE FoodioCraveMapDb;
GO

IF OBJECT_ID(N'dbo.Bookings', N'U') IS NOT NULL DROP TABLE dbo.Bookings;
IF OBJECT_ID(N'dbo.ChatMessages', N'U') IS NOT NULL DROP TABLE dbo.ChatMessages;
IF OBJECT_ID(N'dbo.ChatThreads', N'U') IS NOT NULL DROP TABLE dbo.ChatThreads;
IF OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL DROP TABLE dbo.Reviews;
IF OBJECT_ID(N'dbo.MenuItems', N'U') IS NOT NULL DROP TABLE dbo.MenuItems;
IF OBJECT_ID(N'dbo.CommunityPosts', N'U') IS NOT NULL DROP TABLE dbo.CommunityPosts;
IF OBJECT_ID(N'dbo.AudioTours', N'U') IS NOT NULL DROP TABLE dbo.AudioTours;
IF OBJECT_ID(N'dbo.Restaurants', N'U') IS NOT NULL DROP TABLE dbo.Restaurants;
IF OBJECT_ID(N'dbo.FoodStreets', N'U') IS NOT NULL DROP TABLE dbo.FoodStreets;
IF OBJECT_ID(N'dbo.Categories', N'U') IS NOT NULL DROP TABLE dbo.Categories;
GO

CREATE TABLE dbo.Categories
(
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Categories PRIMARY KEY,
    Name NVARCHAR(80) NOT NULL,
    Slug NVARCHAR(32) NOT NULL,
    Icon NVARCHAR(120) NULL,
    CONSTRAINT UX_Categories_Slug UNIQUE (Slug)
);
GO

CREATE TABLE dbo.FoodStreets
(
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_FoodStreets PRIMARY KEY,
    Name NVARCHAR(140) NOT NULL,
    District NVARCHAR(120) NOT NULL,
    Description NVARCHAR(600) NOT NULL,
    CenterLatitude DECIMAL(9,6) NOT NULL,
    CenterLongitude DECIMAL(9,6) NOT NULL,
    OpeningWindow NVARCHAR(80) NOT NULL
);
GO

CREATE TABLE dbo.Restaurants
(
    Id NVARCHAR(64) NOT NULL CONSTRAINT PK_Restaurants PRIMARY KEY,
    Name NVARCHAR(160) NOT NULL,
    Rating DECIMAL(3,2) NOT NULL,
    PriceRange NVARCHAR(8) NOT NULL,
    Distance NVARCHAR(64) NOT NULL,
    Address NVARCHAR(240) NOT NULL,
    Area NVARCHAR(120) NOT NULL,
    OpeningHours NVARCHAR(80) NOT NULL,
    Image NVARCHAR(1000) NOT NULL,
    IsVerified BIT NOT NULL,
    ReplySpeed NVARCHAR(80) NOT NULL,
    Latitude DECIMAL(9,6) NOT NULL,
    Longitude DECIMAL(9,6) NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Restaurants_IsActive DEFAULT (1),
    CreatedAt DATETIMEOFFSET NOT NULL,
    CategoryId INT NOT NULL,
    FoodStreetId INT NOT NULL,
    CONSTRAINT FK_Restaurants_Categories FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id),
    CONSTRAINT FK_Restaurants_FoodStreets FOREIGN KEY (FoodStreetId) REFERENCES dbo.FoodStreets(Id)
);
GO

CREATE TABLE dbo.MenuItems
(
    Id NVARCHAR(64) NOT NULL CONSTRAINT PK_MenuItems PRIMARY KEY,
    Name NVARCHAR(140) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Image NVARCHAR(1000) NOT NULL,
    Description NVARCHAR(600) NULL,
    IsAvailable BIT NOT NULL CONSTRAINT DF_MenuItems_IsAvailable DEFAULT (1),
    RestaurantId NVARCHAR(64) NOT NULL,
    CONSTRAINT FK_MenuItems_Restaurants FOREIGN KEY (RestaurantId) REFERENCES dbo.Restaurants(Id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.Reviews
(
    Id NVARCHAR(64) NOT NULL CONSTRAINT PK_Reviews PRIMARY KEY,
    Author NVARCHAR(120) NOT NULL,
    Role NVARCHAR(80) NOT NULL,
    Rating DECIMAL(3,2) NOT NULL,
    Comment NVARCHAR(1200) NOT NULL,
    Avatar NVARCHAR(16) NOT NULL,
    CreatedAt DATETIMEOFFSET NOT NULL,
    RestaurantId NVARCHAR(64) NOT NULL,
    CONSTRAINT FK_Reviews_Restaurants FOREIGN KEY (RestaurantId) REFERENCES dbo.Restaurants(Id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.CommunityPosts
(
    Id NVARCHAR(64) NOT NULL CONSTRAINT PK_CommunityPosts PRIMARY KEY,
    Author NVARCHAR(80) NOT NULL,
    Handle NVARCHAR(80) NOT NULL,
    Avatar NVARCHAR(1000) NOT NULL,
    TimeAgo NVARCHAR(40) NOT NULL,
    Rating DECIMAL(3,2) NOT NULL,
    Image NVARCHAR(1000) NOT NULL,
    Content NVARCHAR(1600) NOT NULL,
    LocationName NVARCHAR(160) NOT NULL,
    LikesCount INT NOT NULL,
    CommentsCount INT NOT NULL,
    IsLiked BIT NOT NULL,
    IsSaved BIT NOT NULL,
    CreatedAt DATETIMEOFFSET NOT NULL
);
GO

CREATE TABLE dbo.ChatThreads
(
    Id NVARCHAR(64) NOT NULL CONSTRAINT PK_ChatThreads PRIMARY KEY,
    RestaurantId NVARCHAR(64) NOT NULL,
    Name NVARCHAR(160) NOT NULL,
    Avatar NVARCHAR(1000) NOT NULL,
    StatusText NVARCHAR(80) NOT NULL,
    LastMessageText NVARCHAR(240) NOT NULL,
    LastMessageTime NVARCHAR(40) NOT NULL,
    UnreadCount INT NOT NULL,
    CONSTRAINT FK_ChatThreads_Restaurants FOREIGN KEY (RestaurantId) REFERENCES dbo.Restaurants(Id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.ChatMessages
(
    Id NVARCHAR(64) NOT NULL CONSTRAINT PK_ChatMessages PRIMARY KEY,
    ChatThreadId NVARCHAR(64) NOT NULL,
    Sender NVARCHAR(24) NOT NULL,
    Text NVARCHAR(1200) NOT NULL,
    [Timestamp] NVARCHAR(40) NOT NULL,
    Status NVARCHAR(24) NULL,
    CreatedAt DATETIMEOFFSET NOT NULL,
    CONSTRAINT FK_ChatMessages_ChatThreads FOREIGN KEY (ChatThreadId) REFERENCES dbo.ChatThreads(Id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.AudioTours
(
    Id NVARCHAR(64) NOT NULL CONSTRAINT PK_AudioTours PRIMARY KEY,
    Title NVARCHAR(160) NOT NULL,
    Location NVARCHAR(160) NOT NULL,
    Image NVARCHAR(1000) NOT NULL,
    MapImage NVARCHAR(1000) NOT NULL,
    IsTrending BIT NOT NULL,
    Rating DECIMAL(3,2) NOT NULL,
    Duration NVARCHAR(40) NOT NULL,
    StopsCount INT NOT NULL,
    Vibe NVARCHAR(60) NOT NULL,
    Description NVARCHAR(1000) NOT NULL
);
GO

CREATE TABLE dbo.Bookings
(
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Bookings PRIMARY KEY,
    RestaurantId NVARCHAR(64) NOT NULL,
    [Date] DATE NOT NULL,
    [Time] TIME NOT NULL,
    Guests INT NOT NULL,
    Seating NVARCHAR(40) NOT NULL,
    Status NVARCHAR(40) NOT NULL,
    CreatedAt DATETIMEOFFSET NOT NULL,
    CONSTRAINT FK_Bookings_Restaurants FOREIGN KEY (RestaurantId) REFERENCES dbo.Restaurants(Id) ON DELETE CASCADE
);
GO

SET IDENTITY_INSERT dbo.Categories ON;
INSERT INTO dbo.Categories (Id, Name, Slug, Icon) VALUES
(1, N'Seafood', N'seafood', N'waves'),
(2, N'Noodles', N'noodles', N'soup'),
(3, N'Street Food', N'street-food', N'store'),
(4, N'Cafe', N'cafe', N'coffee');
SET IDENTITY_INSERT dbo.Categories OFF;
GO

SET IDENTITY_INSERT dbo.FoodStreets ON;
INSERT INTO dbo.FoodStreets (Id, Name, District, Description, CenterLatitude, CenterLongitude, OpeningWindow) VALUES
(1, N'Vinh Khanh Food Street', N'District 4, Ho Chi Minh City', N'A dense seafood corridor known for snails, grilled shellfish, and canal-side tables.', 10.759245, 106.706566, N'5:00 PM - 12:00 AM'),
(2, N'Pham Ngu Lao Night Bites', N'District 1, Ho Chi Minh City', N'Late-night noodle shops and quick street snacks near the backpacker quarter.', 10.767611, 106.693641, N'Open late'),
(3, N'Nguyen Trai Alley Eats', N'District 1, Ho Chi Minh City', N'Small alley stalls serving seafood, banh mi, and local comfort food.', 10.764812, 106.688938, N'10:00 AM - 11:00 PM');
SET IDENTITY_INSERT dbo.FoodStreets OFF;
GO

DECLARE @CreatedAt DATETIMEOFFSET = '2026-06-03T00:00:00+00:00';
DECLARE @SeafoodImage NVARCHAR(1000) = N'https://images.unsplash.com/photo-1559737558-2f5a35f4523b';
DECLARE @PhoImage NVARCHAR(1000) = N'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10';
DECLARE @BanhMiImage NVARCHAR(1000) = N'https://images.unsplash.com/photo-1608039829572-78524f79c4c7';

INSERT INTO dbo.Restaurants
(Id, Name, Rating, PriceRange, Distance, Address, Area, OpeningHours, Image, IsVerified, ReplySpeed, Latitude, Longitude, IsActive, CreatedAt, CategoryId, FoodStreetId)
VALUES
(N'oc_dao', N'Oc Dao', 4.80, N'$$$', N'1.2 km away', N'212B Alley, Nguyen Trai Street', N'District 1, Ho Chi Minh City', N'10:00 AM - 11:00 PM', @SeafoodImage, 1, N'Usually replies in 5m', 10.763921, 106.688515, 1, @CreatedAt, 1, 3),
(N'oc_oanh', N'Oc Oanh', 4.80, N'$$', N'0.5 km away', N'534 Vinh Khanh Street', N'District 4, Ho Chi Minh City', N'1:00 PM - 12:00 AM', @SeafoodImage, 1, N'Usually replies in 5m', 10.759031, 106.706962, 1, @CreatedAt, 1, 1),
(N'pho_quynh', N'Pho Quynh', 4.50, N'$', N'1.8 km away', N'323 Pham Ngu Lao', N'District 1, Ho Chi Minh City', N'Open 24/7', @PhoImage, 0, N'Replies in standard hours', 10.767836, 106.693385, 1, @CreatedAt, 2, 2),
(N'banh_mi_25', N'Banh Mi 25', 4.60, N'$', N'2.0 km away', N'25 Huynh Khuong Ninh', N'District 1, Ho Chi Minh City', N'7:00 AM - 9:00 PM', @BanhMiImage, 1, N'Replies in 1h', 10.791013, 106.695142, 1, @CreatedAt, 3, 3);

INSERT INTO dbo.MenuItems (Id, RestaurantId, Name, Price, Image, Description, IsAvailable) VALUES
(N'dish_1', N'oc_dao', N'Garlic Butter Crab', 15.00, @SeafoodImage, N'Spicy stir-fried crab with rich garlic butter sauce.', 1),
(N'dish_2', N'oc_dao', N'Grilled Oysters', 12.50, @SeafoodImage, N'Fresh oysters grilled with scallion oil and toasted peanuts.', 1),
(N'dish_oanh_1', N'oc_oanh', N'Spicy Tamarind Snails', 8.50, @SeafoodImage, N'Sweet and sour tamarind snails with morning glory.', 1),
(N'dish_pq_1', N'pho_quynh', N'Beef Pho Special', 4.50, @PhoImage, N'Beef pho with rare beef, brisket, tendon, and beef balls.', 1),
(N'dish_bm25_1', N'banh_mi_25', N'Original Pate Banh Mi', 3.25, @BanhMiImage, N'Crisp baguette with pate, pork, herbs, pickles, and chili.', 1);

INSERT INTO dbo.Reviews (Id, RestaurantId, Author, Role, Rating, Comment, Avatar, CreatedAt) VALUES
(N'rev_1', N'oc_dao', N'Jane Doe', N'Local Guide', 5.00, N'Incredible alley spot. The garlic butter sauce is perfect with bread.', N'JD', @CreatedAt),
(N'rev_oanh_1', N'oc_oanh', N'Minh Tuan', N'Snail aficionado', 5.00, N'Fast service and a lively street-side seafood atmosphere.', N'MT', @CreatedAt),
(N'rev_pq_1', N'pho_quynh', N'An Binh', N'Pho lover', 4.00, N'Open all night and very popular near Bui Vien walking street.', N'AB', @CreatedAt);

INSERT INTO dbo.CommunityPosts
(Id, Author, Handle, Avatar, TimeAgo, Rating, Image, Content, LocationName, LikesCount, CommentsCount, IsLiked, IsSaved, CreatedAt)
VALUES
(N'post_1', N'foodie_explorer', N'@foodie_explorer', @SeafoodImage, N'2 hours ago', 4.80, @SeafoodImage, N'A tiny alley stall with bold seafood flavors and a packed local crowd.', N'Oc Dao', 245, 18, 0, 0, @CreatedAt),
(N'post_2', N'street_bites', N'@street_bites', @PhoImage, N'5 hours ago', 4.00, @PhoImage, N'Rich broth, springy noodles, tight seating, and the right late-night energy.', N'Pho Quynh', 892, 45, 1, 0, @CreatedAt);

INSERT INTO dbo.ChatThreads
(Id, RestaurantId, Name, Avatar, StatusText, LastMessageText, LastMessageTime, UnreadCount)
VALUES
(N'oc_oanh_thread', N'oc_oanh', N'Oc Oanh', @SeafoodImage, N'Usually replies in 5m', N'Perfect. We will hold an outdoor table for you.', N'Now', 0),
(N'banh_mi_25_thread', N'banh_mi_25', N'Banh Mi 25', @BanhMiImage, N'Replies in 1h', N'We are sold out for today, sorry!', N'Yesterday', 0);

INSERT INTO dbo.ChatMessages
(Id, ChatThreadId, Sender, Text, [Timestamp], Status, CreatedAt)
VALUES
(N'msg_1', N'oc_oanh_thread', N'user', N'Hi, do you have a table for 4 tonight around 7 PM?', N'4:30 PM', N'read', @CreatedAt),
(N'msg_2', N'oc_oanh_thread', N'restaurant', N'Hello! Yes, we have space. Do you prefer indoor or street-side outdoor seating?', N'4:32 PM', NULL, @CreatedAt),
(N'msg_3', N'oc_oanh_thread', N'restaurant', N'Perfect. We will hold an outdoor table for you.', N'Just now', NULL, @CreatedAt),
(N'msg_bm25_1', N'banh_mi_25_thread', N'user', N'Do you still have original pate banh mi?', N'Yesterday', N'read', @CreatedAt),
(N'msg_bm25_2', N'banh_mi_25_thread', N'restaurant', N'We are sold out for today, sorry!', N'Yesterday', NULL, @CreatedAt);

INSERT INTO dbo.AudioTours
(Id, Title, Location, Image, MapImage, IsTrending, Rating, Duration, StopsCount, Vibe, Description)
VALUES
(N'tour_1', N'Midnight Snacking', N'District 1 and District 4 alleys', @SeafoodImage, @SeafoodImage, 1, 4.90, N'2.5 hrs', 6, N'Energetic', N'A vibrant nighttime walk through seafood alleys, noodle counters, and quick snack stops.'),
(N'tour_2', N'Seafood Heaven Tour', N'Vinh Khanh Food Street', @SeafoodImage, @SeafoodImage, 0, 4.70, N'1.5 hrs', 4, N'Premium', N'Fresh shellfish, grilled oysters, and local ordering tips from the canal-side stalls.');
GO
