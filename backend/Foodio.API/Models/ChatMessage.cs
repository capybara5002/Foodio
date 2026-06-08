using System.ComponentModel.DataAnnotations;

namespace Foodio.API.Models;

public class ChatMessage
{
    [Key]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string ChatThreadId { get; set; } = string.Empty;

    [Required]
    [MaxLength(24)]
    public string Sender { get; set; } = "user";

    [Required]
    [MaxLength(64)]
    public string SenderId { get; set; } = string.Empty;

    [Required]
    [MaxLength(1200)]
    public string Text { get; set; } = string.Empty;

    [Required]
    [MaxLength(40)]
    public string Timestamp { get; set; } = string.Empty;

    [MaxLength(24)]
    public string? Status { get; set; }

    [Required]
    [MaxLength(24)]
    public string MessageType { get; set; } = "Text";

    public bool IsSystemNotification { get; set; }

    [MaxLength(2000)]
    public string? BookingPayloadJson { get; set; }

    public string? ImageData { get; set; }

    [MaxLength(260)]
    public string? ImageFileName { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ChatThread? ChatThread { get; set; }
}
