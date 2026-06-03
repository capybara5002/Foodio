using System.ComponentModel.DataAnnotations;

namespace Foodio.API.Models;

public class ChatThread
{
    [Key]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string RestaurantId { get; set; } = string.Empty;

    [Required]
    [MaxLength(160)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Avatar { get; set; } = string.Empty;

    [MaxLength(80)]
    public string StatusText { get; set; } = string.Empty;

    [MaxLength(240)]
    public string LastMessageText { get; set; } = string.Empty;

    [MaxLength(40)]
    public string LastMessageTime { get; set; } = string.Empty;

    public int UnreadCount { get; set; }

    public Restaurant? Restaurant { get; set; }
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
