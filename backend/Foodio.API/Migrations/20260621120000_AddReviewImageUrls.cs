using Foodio.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Foodio.API.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260621120000_AddReviewImageUrls")]
public class AddReviewImageUrls : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "ImageUrlsJson",
            table: "Reviews",
            type: "nvarchar(max)",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "ImageUrlsJson",
            table: "Reviews");
    }
}
