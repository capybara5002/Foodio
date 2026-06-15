using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Foodio.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOwnerReplyToReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ChatMessages",
                keyColumn: "Id",
                keyValue: "msg_1");

            migrationBuilder.DeleteData(
                table: "ChatMessages",
                keyColumn: "Id",
                keyValue: "msg_2");

            migrationBuilder.DeleteData(
                table: "ChatMessages",
                keyColumn: "Id",
                keyValue: "msg_3");

            migrationBuilder.DeleteData(
                table: "ChatMessages",
                keyColumn: "Id",
                keyValue: "msg_bm25_1");

            migrationBuilder.DeleteData(
                table: "ChatMessages",
                keyColumn: "Id",
                keyValue: "msg_bm25_2");

            migrationBuilder.DeleteData(
                table: "ChatMessages",
                keyColumn: "Id",
                keyValue: "msg_pq_1");

            migrationBuilder.DeleteData(
                table: "CommunityPosts",
                keyColumn: "Id",
                keyValue: "post_2");

            migrationBuilder.DeleteData(
                table: "PostComments",
                keyColumn: "Id",
                keyValue: "pcom_1");

            migrationBuilder.DeleteData(
                table: "PostComments",
                keyColumn: "Id",
                keyValue: "pcom_2");

            migrationBuilder.DeleteData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: "oc_dao");

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: "usr_1");

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: "usr_2");

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: "usr_3");

            migrationBuilder.DeleteData(
                table: "ChatThreads",
                keyColumn: "Id",
                keyValue: "banh_mi_25_thread");

            migrationBuilder.DeleteData(
                table: "ChatThreads",
                keyColumn: "Id",
                keyValue: "oc_oanh_thread");

            migrationBuilder.DeleteData(
                table: "ChatThreads",
                keyColumn: "Id",
                keyValue: "pho_quynh_thread");

            migrationBuilder.DeleteData(
                table: "CommunityPosts",
                keyColumn: "Id",
                keyValue: "post_1");

            migrationBuilder.DeleteData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: "banh_mi_25");

            migrationBuilder.DeleteData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: "oc_oanh");

            migrationBuilder.DeleteData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: "pho_quynh");

            migrationBuilder.AddColumn<string>(
                name: "OwnerReply",
                table: "Reviews",
                type: "nvarchar(1200)",
                maxLength: 1200,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "OwnerReplyCreatedAt",
                table: "Reviews",
                type: "datetimeoffset",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OwnerReply",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "OwnerReplyCreatedAt",
                table: "Reviews");

            migrationBuilder.InsertData(
                table: "CommunityPosts",
                columns: new[] { "Id", "Author", "Avatar", "CommentsCount", "Content", "CreatedAt", "Handle", "Image", "IsApproved", "IsLiked", "IsRestaurantPost", "IsSaved", "LikesCount", "LocationName", "Rating", "TimeAgo" },
                values: new object[,]
                {
                    { "post_1", "foodie_explorer", "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", 18, "A tiny alley stall with bold seafood flavors and a packed local crowd.", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "@foodie_explorer", "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", false, false, false, false, 245, "Oc Dao", 4.8m, "2 hours ago" },
                    { "post_2", "street_bites", "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10", 45, "Rich broth, springy noodles, tight seating, and the right late-night energy.", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "@street_bites", "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10", false, true, false, false, 892, "Pho Quynh", 4.0m, "5 hours ago" }
                });

            migrationBuilder.InsertData(
                table: "Restaurants",
                columns: new[] { "Id", "Address", "Area", "AudioPriority", "AudioUrl", "CategoryId", "CreatedAt", "Description", "Distance", "FoodStreetId", "GeofenceRadiusMeters", "Image", "IsActive", "IsVerified", "Latitude", "Longitude", "Name", "OpeningHours", "PriceRange", "Rating", "ReplySpeed", "TableStatuses", "UpdatedAt" },
                values: new object[,]
                {
                    { "banh_mi_25", "25 Huynh Khuong Ninh", "District 1, Ho Chi Minh City", 40, null, 3, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "", "2.0 km away", 3, 30, "https://images.unsplash.com/photo-1608039829572-78524f79c4c7", true, true, 10.791013m, 106.695142m, "Banh Mi 25", "7:00 AM - 9:00 PM", "$", 4.6m, "Replies in 1h", null, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { "oc_dao", "212B Alley, Nguyen Trai Street", "District 1, Ho Chi Minh City", 70, null, 1, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "", "1.2 km away", 3, 35, "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", true, true, 10.763921m, 106.688515m, "Oc Dao", "10:00 AM - 11:00 PM", "$$$", 4.8m, "Usually replies in 5m", null, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { "oc_oanh", "534 Vinh Khanh Street", "District 4, Ho Chi Minh City", 100, null, 1, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "", "0.5 km away", 1, 45, "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", true, true, 10.759031m, 106.706962m, "Oc Oanh", "1:00 PM - 12:00 AM", "$$", 4.8m, "Usually replies in 5m", null, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { "pho_quynh", "323 Pham Ngu Lao", "District 1, Ho Chi Minh City", 55, null, 2, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "", "1.8 km away", 2, 30, "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10", true, false, 10.767836m, 106.693385m, "Pho Quynh", "Open 24/7", "$", 4.5m, "Replies in standard hours", null, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Avatar", "CreatedAt", "Email", "IsActive", "OwnerStatus", "PasswordHash", "RestaurantId", "Role", "Username" },
                values: new object[,]
                {
                    { "usr_1", null, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "admin@foodio.com", true, "None", "123456", null, "Admin", "admin" },
                    { "usr_2", null, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "owner@foodio.com", true, "Verified", "123456", "oc_dao", "Owner", "owner_ocdao" },
                    { "usr_3", null, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "customer@foodio.com", true, "None", "123456", null, "User", "customer" }
                });

            migrationBuilder.InsertData(
                table: "ChatThreads",
                columns: new[] { "Id", "Avatar", "LastMessageText", "LastMessageTime", "Name", "RestaurantId", "StatusText", "UnreadCount", "UserId" },
                values: new object[,]
                {
                    { "banh_mi_25_thread", "https://images.unsplash.com/photo-1608039829572-78524f79c4c7", "We are sold out for today, sorry!", "2026-06-02T00:00:00.0000000+00:00", "Banh Mi 25", "banh_mi_25", "Replies in 1h", 0, "usr_3" },
                    { "oc_oanh_thread", "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", "Perfect. We will hold an outdoor table for you.", "2026-06-03T00:03:00.0000000+00:00", "Oc Oanh", "oc_oanh", "Usually replies in 5m", 0, "usr_3" },
                    { "pho_quynh_thread", "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10", "Your reservation is confirmed!", "2026-06-03T00:04:00.0000000+00:00", "Pho Quynh", "pho_quynh", "Replies in standard hours", 1, "usr_3" }
                });

            migrationBuilder.InsertData(
                table: "PostComments",
                columns: new[] { "Id", "Author", "Avatar", "CommunityPostId", "Content", "CreatedAt" },
                values: new object[,]
                {
                    { "pcom_1", "local_guide_jane", "https://ui-avatars.com/api/?name=Jane&background=random", "post_1", "I completely agree! The snails here are to die for.", new DateTimeOffset(new DateTime(2026, 6, 3, 1, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { "pcom_2", "mike_eats_world", "https://ui-avatars.com/api/?name=Mike&background=random", "post_1", "Is it hard to find a table on weekends?", new DateTimeOffset(new DateTime(2026, 6, 3, 1, 30, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) }
                });

            migrationBuilder.InsertData(
                table: "ChatMessages",
                columns: new[] { "Id", "BookingPayloadJson", "ChatThreadId", "CreatedAt", "ImageData", "ImageFileName", "IsSystemNotification", "MessageType", "Sender", "SenderId", "Status", "Text", "Timestamp" },
                values: new object[,]
                {
                    { "msg_1", null, "oc_oanh_thread", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, false, "Text", "user", "usr_3", "read", "Hi, do you have a table for 4 tonight around 7 PM?", "4:30 PM" },
                    { "msg_2", null, "oc_oanh_thread", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 2, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, false, "Text", "restaurant", "owner_oc_oanh", null, "Hello! Yes, we have space. Do you prefer indoor or street-side outdoor seating?", "4:32 PM" },
                    { "msg_3", null, "oc_oanh_thread", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 3, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, false, "Text", "restaurant", "owner_oc_oanh", null, "Perfect. We will hold an outdoor table for you.", "Just now" },
                    { "msg_bm25_1", null, "banh_mi_25_thread", new DateTimeOffset(new DateTime(2026, 6, 2, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, false, "Text", "user", "usr_3", "read", "Do you still have original pate banh mi?", "Yesterday" },
                    { "msg_bm25_2", null, "banh_mi_25_thread", new DateTimeOffset(new DateTime(2026, 6, 2, 0, 2, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, false, "Text", "restaurant", "owner_banh_mi_25", null, "We are sold out for today, sorry!", "Yesterday" },
                    { "msg_pq_1", null, "pho_quynh_thread", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 4, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, true, "Text", "system", "system", null, "Your reservation is confirmed!", "10:42 AM" }
                });
        }
    }
}
