using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Foodio.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveMockSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChatThreads_RestaurantId",
                table: "ChatThreads");

            migrationBuilder.DeleteData(
                table: "AudioTours",
                keyColumn: "Id",
                keyValue: "tour_1");

            migrationBuilder.DeleteData(
                table: "AudioTours",
                keyColumn: "Id",
                keyValue: "tour_2");

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 4);

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
                table: "CommunityPosts",
                keyColumn: "Id",
                keyValue: "post_1");

            migrationBuilder.DeleteData(
                table: "CommunityPosts",
                keyColumn: "Id",
                keyValue: "post_2");

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "dish_1");

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "dish_2");

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "dish_bm25_1");

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "dish_oanh_1");

            migrationBuilder.DeleteData(
                table: "MenuItems",
                keyColumn: "Id",
                keyValue: "dish_pq_1");

            migrationBuilder.DeleteData(
                table: "Reviews",
                keyColumn: "Id",
                keyValue: "rev_1");

            migrationBuilder.DeleteData(
                table: "Reviews",
                keyColumn: "Id",
                keyValue: "rev_2");

            migrationBuilder.DeleteData(
                table: "Reviews",
                keyColumn: "Id",
                keyValue: "rev_3");

            migrationBuilder.DeleteData(
                table: "Reviews",
                keyColumn: "Id",
                keyValue: "rev_oanh_1");

            migrationBuilder.DeleteData(
                table: "Reviews",
                keyColumn: "Id",
                keyValue: "rev_oanh_2");

            migrationBuilder.DeleteData(
                table: "Reviews",
                keyColumn: "Id",
                keyValue: "rev_pq_1");

            migrationBuilder.DeleteData(
                table: "Reviews",
                keyColumn: "Id",
                keyValue: "rev_pq_2");

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
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: "oc_dao");

            migrationBuilder.DeleteData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: "pho_quynh");

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "FoodStreets",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: "banh_mi_25");

            migrationBuilder.DeleteData(
                table: "Restaurants",
                keyColumn: "Id",
                keyValue: "oc_oanh");

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "FoodStreets",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "FoodStreets",
                keyColumn: "Id",
                keyValue: 3);


        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {


            migrationBuilder.InsertData(
                table: "AudioTours",
                columns: new[] { "Id", "Description", "Duration", "Image", "IsTrending", "Location", "MapImage", "Rating", "StopsCount", "Title", "Vibe" },
                values: new object[,]
                {
                    { "tour_1", "A vibrant nighttime walk through seafood alleys, noodle counters, and quick snack stops.", "2.5 hrs", "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", true, "District 1 and District 4 alleys", "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", 4.9m, 6, "Midnight Snacking", "Energetic" },
                    { "tour_2", "Fresh shellfish, grilled oysters, and local ordering tips from the canal-side stalls.", "1.5 hrs", "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", false, "Vinh Khanh Food Street", "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", 4.7m, 4, "Seafood Heaven Tour", "Premium" }
                });

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Icon", "Name", "Slug" },
                values: new object[,]
                {
                    { 1, "waves", "Seafood", "seafood" },
                    { 2, "soup", "Noodles", "noodles" },
                    { 3, "store", "Street Food", "street-food" },
                    { 4, "coffee", "Cafe", "cafe" }
                });

            migrationBuilder.InsertData(
                table: "CommunityPosts",
                columns: new[] { "Id", "Author", "Avatar", "CommentsCount", "Content", "CreatedAt", "Handle", "Image", "IsLiked", "IsSaved", "LikesCount", "LocationName", "Rating", "TimeAgo" },
                values: new object[,]
                {
                    { "post_1", "foodie_explorer", "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", 18, "A tiny alley stall with bold seafood flavors and a packed local crowd.", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "@foodie_explorer", "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", false, false, 245, "Oc Dao", 4.8m, "2 hours ago" },
                    { "post_2", "street_bites", "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10", 45, "Rich broth, springy noodles, tight seating, and the right late-night energy.", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "@street_bites", "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10", true, false, 892, "Pho Quynh", 4.0m, "5 hours ago" }
                });

            migrationBuilder.InsertData(
                table: "FoodStreets",
                columns: new[] { "Id", "CenterLatitude", "CenterLongitude", "Description", "District", "Name", "OpeningWindow" },
                values: new object[,]
                {
                    { 1, 10.759245m, 106.706566m, "A dense seafood corridor known for snails, grilled shellfish, and canal-side tables.", "District 4, Ho Chi Minh City", "Vinh Khanh Food Street", "5:00 PM - 12:00 AM" },
                    { 2, 10.767611m, 106.693641m, "Late-night noodle shops and quick street snacks near the backpacker quarter.", "District 1, Ho Chi Minh City", "Pham Ngu Lao Night Bites", "Open late" },
                    { 3, 10.764812m, 106.688938m, "Small alley stalls serving seafood, banh mi, and local comfort food.", "District 1, Ho Chi Minh City", "Nguyen Trai Alley Eats", "10:00 AM - 11:00 PM" }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "IsActive", "PasswordHash", "RestaurantId", "Role", "Username" },
                values: new object[,]
                {
                    { "usr_1", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "admin@foodio.com", true, "123456", null, "Admin", "admin" },
                    { "usr_2", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "owner@foodio.com", true, "123456", "oc_dao", "Owner", "owner_ocdao" },
                    { "usr_3", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "customer@foodio.com", true, "123456", null, "User", "customer" }
                });

            migrationBuilder.InsertData(
                table: "Restaurants",
                columns: new[] { "Id", "Address", "Area", "CategoryId", "CreatedAt", "Distance", "FoodStreetId", "Image", "IsActive", "IsVerified", "Latitude", "Longitude", "Name", "OpeningHours", "PriceRange", "Rating", "ReplySpeed" },
                values: new object[,]
                {
                    { "banh_mi_25", "25 Huynh Khuong Ninh", "District 1, Ho Chi Minh City", 3, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "2.0 km away", 3, "https://images.unsplash.com/photo-1608039829572-78524f79c4c7", true, true, 10.791013m, 106.695142m, "Banh Mi 25", "7:00 AM - 9:00 PM", "$", 4.6m, "Replies in 1h" },
                    { "oc_dao", "212B Alley, Nguyen Trai Street", "District 1, Ho Chi Minh City", 1, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "1.2 km away", 3, "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", true, true, 10.763921m, 106.688515m, "Oc Dao", "10:00 AM - 11:00 PM", "$$$", 4.8m, "Usually replies in 5m" },
                    { "oc_oanh", "534 Vinh Khanh Street", "District 4, Ho Chi Minh City", 1, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "0.5 km away", 1, "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", true, true, 10.759031m, 106.706962m, "Oc Oanh", "1:00 PM - 12:00 AM", "$$", 4.8m, "Usually replies in 5m" },
                    { "pho_quynh", "323 Pham Ngu Lao", "District 1, Ho Chi Minh City", 2, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "1.8 km away", 2, "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10", true, false, 10.767836m, 106.693385m, "Pho Quynh", "Open 24/7", "$", 4.5m, "Replies in standard hours" }
                });

            migrationBuilder.InsertData(
                table: "ChatThreads",
                columns: new[] { "Id", "Avatar", "LastMessageText", "LastMessageTime", "Name", "RestaurantId", "StatusText", "UnreadCount" },
                values: new object[,]
                {
                    { "banh_mi_25_thread", "https://images.unsplash.com/photo-1608039829572-78524f79c4c7", "We are sold out for today, sorry!", "Yesterday", "Banh Mi 25", "banh_mi_25", "Replies in 1h", 0 },
                    { "oc_oanh_thread", "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", "Perfect. We will hold an outdoor table for you.", "Now", "Oc Oanh", "oc_oanh", "Usually replies in 5m", 0 }
                });

            migrationBuilder.InsertData(
                table: "MenuItems",
                columns: new[] { "Id", "Description", "Image", "IsAvailable", "Name", "Price", "RestaurantId" },
                values: new object[,]
                {
                    { "dish_1", "Spicy stir-fried crab with rich garlic butter sauce.", "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", true, "Garlic Butter Crab", 15.00m, "oc_dao" },
                    { "dish_2", "Fresh oysters grilled with scallion oil and toasted peanuts.", "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", true, "Grilled Oysters", 12.50m, "oc_dao" },
                    { "dish_bm25_1", "Crisp baguette with pate, pork, herbs, pickles, and chili.", "https://images.unsplash.com/photo-1608039829572-78524f79c4c7", true, "Original Pate Banh Mi", 3.25m, "banh_mi_25" },
                    { "dish_oanh_1", "Sweet and sour tamarind snails with morning glory.", "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", true, "Spicy Tamarind Snails", 8.50m, "oc_oanh" },
                    { "dish_pq_1", "Beef pho with rare beef, brisket, tendon, and beef balls.", "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10", true, "Beef Pho Special", 4.50m, "pho_quynh" }
                });

            migrationBuilder.InsertData(
                table: "Reviews",
                columns: new[] { "Id", "Author", "Avatar", "Comment", "CreatedAt", "ImageUrl", "Rating", "RestaurantId", "Role" },
                values: new object[,]
                {
                    { "rev_1", "Jane Doe", "JD", "Incredible alley spot. The garlic butter sauce is perfect with bread.", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", 5.0m, "oc_dao", "Local Guide" },
                    { "rev_2", "Alex Smith", "AS", "Great crab but a bit crowded. Prices are moderate.", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, 4.0m, "oc_dao", "Food Traveler" },
                    { "rev_3", "Nguyen Van A", "NV", "Average snails. The service is nice though.", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, 3.0m, "oc_dao", "Street Food Lover" },
                    { "rev_oanh_1", "Minh Tuan", "MT", "Fast service and a lively street-side seafood atmosphere.", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "https://images.unsplash.com/photo-1559737558-2f5a35f4523b", 5.0m, "oc_oanh", "Snail aficionado" },
                    { "rev_oanh_2", "Tran Binh", "TB", "Lively place. Highly recommend the tamarind sauce snails.", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, 4.0m, "oc_oanh", "Snack critic" },
                    { "rev_pq_1", "An Binh", "AB", "Open all night and very popular near Bui Vien walking street.", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10", 4.0m, "pho_quynh", "Pho lover" },
                    { "rev_pq_2", "John C", "JC", "Delicious hot broth, super fresh herbs. Best late night meal!", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10", 5.0m, "pho_quynh", "Backpacker" }
                });

            migrationBuilder.InsertData(
                table: "ChatMessages",
                columns: new[] { "Id", "ChatThreadId", "CreatedAt", "Sender", "Status", "Text", "Timestamp" },
                values: new object[,]
                {
                    { "msg_1", "oc_oanh_thread", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "user", "read", "Hi, do you have a table for 4 tonight around 7 PM?", "4:30 PM" },
                    { "msg_2", "oc_oanh_thread", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "restaurant", null, "Hello! Yes, we have space. Do you prefer indoor or street-side outdoor seating?", "4:32 PM" },
                    { "msg_3", "oc_oanh_thread", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "restaurant", null, "Perfect. We will hold an outdoor table for you.", "Just now" },
                    { "msg_bm25_1", "banh_mi_25_thread", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "user", "read", "Do you still have original pate banh mi?", "Yesterday" },
                    { "msg_bm25_2", "banh_mi_25_thread", new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "restaurant", null, "We are sold out for today, sorry!", "Yesterday" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatThreads_RestaurantId",
                table: "ChatThreads",
                column: "RestaurantId");
        }
    }
}
