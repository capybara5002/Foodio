using System.ComponentModel.DataAnnotations;

namespace Foodio.API.Models;

public class SavedPlace
{
    [Key]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string RestaurantId { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? User { get; set; }
    public Restaurant? Restaurant { get; set; }
}
