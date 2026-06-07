using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Foodio.API.Models;

public class RestaurantRequest
{
    [Key]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string OwnerId { get; set; } = string.Empty;

    [Required]
    [MaxLength(160)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(8)]
    public string PriceRange { get; set; } = "$";

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public int FoodStreetId { get; set; }
    public FoodStreet? FoodStreet { get; set; }

    [MaxLength(64)]
    public string Distance { get; set; } = string.Empty;

    [Required]
    [MaxLength(240)]
    public string Address { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string Area { get; set; } = string.Empty;

    [Required]
    [MaxLength(80)]
    public string OpeningHours { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Image { get; set; } = string.Empty;

    [Column(TypeName = "decimal(9,6)")]
    public decimal Latitude { get; set; }

    [Column(TypeName = "decimal(9,6)")]
    public decimal Longitude { get; set; }

    /// <summary>Pending | Approved | Rejected</summary>
    [Required]
    [MaxLength(16)]
    public string Status { get; set; } = "Pending";

    [MaxLength(500)]
    public string? AdminNote { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? ReviewedAt { get; set; }

    // Navigation
    public User? Owner { get; set; }
}
