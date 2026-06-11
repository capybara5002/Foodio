using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Foodio.API.Models;

public class PostComment
{
    [Key]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string CommunityPostId { get; set; } = string.Empty;

    [Required]
    [MaxLength(80)]
    public string Author { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Avatar { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [ForeignKey(nameof(CommunityPostId))]
    public CommunityPost CommunityPost { get; set; } = null!;
}
