using System;
using System.ComponentModel.DataAnnotations;

namespace Foodio.API.Models;

public class Notification
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(64)]
    public string UserId { get; set; } = string.Empty;

    [MaxLength(64)]
    public string? RestaurantId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty; // e.g., "Booking", "Review", "RequestApproval", "ChatMessage"

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Body { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? PayloadJson { get; set; }

    public bool IsRead { get; set; } = false;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
