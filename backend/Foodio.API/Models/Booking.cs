using System.ComponentModel.DataAnnotations;

namespace Foodio.API.Models;

public class Booking
{
    public int Id { get; set; }

    [Required]
    [MaxLength(64)]
    public string RestaurantId { get; set; } = string.Empty;

    public DateOnly Date { get; set; }
    public TimeOnly Time { get; set; }
    public int Guests { get; set; }

    [Required]
    [MaxLength(40)]
    public string Seating { get; set; } = string.Empty;

    [Required]
    [MaxLength(40)]
    public string Status { get; set; } = "Confirmed";

    [Required]
    [MaxLength(64)]
    public string UserId { get; set; } = "usr_3"; // Default customer ID

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Restaurant? Restaurant { get; set; }
}
