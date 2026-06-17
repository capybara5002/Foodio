using System.ComponentModel.DataAnnotations;

namespace Foodio.API.Models;

public class PaymentSession
{
    [Key]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string ClientToken { get; set; } = string.Empty;

    [Required]
    [MaxLength(32)]
    public string AccessType { get; set; } = "Customer";

    public decimal Amount { get; set; }

    [Required]
    [MaxLength(8)]
    public string Currency { get; set; } = "VND";

    [Required]
    [MaxLength(24)]
    public string Status { get; set; } = "Pending";

    [Required]
    [MaxLength(32)]
    public string Provider { get; set; } = "DemoQR";

    [Required]
    [MaxLength(64)]
    public string PaymentReference { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string QrPayload { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? PaidAt { get; set; }

    public DateTimeOffset? ExpiresAt { get; set; }

    public DateTimeOffset? LastValidatedAt { get; set; }
}
