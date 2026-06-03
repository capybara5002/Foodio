using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Foodio.API.Models;

public class Review
{
    [Key]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string Author { get; set; } = string.Empty;

    [Required]
    [MaxLength(80)]
    public string Role { get; set; } = string.Empty;

    [Column(TypeName = "decimal(3,2)")]
    public decimal Rating { get; set; }

    [Required]
    [MaxLength(1200)]
    public string Comment { get; set; } = string.Empty;

    [Required]
    [MaxLength(16)]
    public string Avatar { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [Required]
    [MaxLength(64)]
    public string RestaurantId { get; set; } = string.Empty;

    public Restaurant? Restaurant { get; set; }
}
