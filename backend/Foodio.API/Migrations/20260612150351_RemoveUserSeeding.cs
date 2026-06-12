using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Foodio.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUserSeeding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Avatar", "CreatedAt", "Email", "IsActive", "OwnerStatus", "PasswordHash", "RestaurantId", "Role", "Username" },
                values: new object[,]
                {
                    { "usr_1", null, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "admin@foodio.com", true, "None", "123456", null, "Admin", "admin" },
                    { "usr_2", null, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "owner@foodio.com", true, "None", "123456", "oc_dao", "Owner", "owner_ocdao" },
                    { "usr_3", null, new DateTimeOffset(new DateTime(2026, 6, 3, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "customer@foodio.com", true, "None", "123456", null, "User", "customer" }
                });
        }
    }
}
