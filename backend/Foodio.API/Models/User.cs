using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Foodio.API.Models;

public class User
{
    [Key]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(256)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Role { get; set; } = "User"; // "Admin", "Owner", "User"

    [MaxLength(64)]
    public string? RestaurantId { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
