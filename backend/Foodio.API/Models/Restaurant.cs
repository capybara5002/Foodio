using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Foodio.API.Models;

public class Restaurant
{
    [Key]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(160)]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "decimal(3,2)")]
    public decimal Rating { get; set; }

    [Required]
    [MaxLength(8)]
    public string PriceRange { get; set; } = "$";

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

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public string? TableStatuses { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Image { get; set; } = string.Empty;

    public bool IsVerified { get; set; }

    [MaxLength(80)]
    public string ReplySpeed { get; set; } = string.Empty;

    [Column(TypeName = "decimal(9,6)")]
    public decimal Latitude { get; set; }

    [Column(TypeName = "decimal(9,6)")]
    public decimal Longitude { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public int FoodStreetId { get; set; }
    public FoodStreet? FoodStreet { get; set; }

    public ICollection<MenuItem> Dishes { get; set; } = new List<MenuItem>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
