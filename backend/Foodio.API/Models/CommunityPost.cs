using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Foodio.API.Models;

public class CommunityPost
{
    [Key]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(80)]
    public string Author { get; set; } = string.Empty;

    [Required]
    [MaxLength(80)]
    public string Handle { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Avatar { get; set; } = string.Empty;

    [MaxLength(40)]
    public string TimeAgo { get; set; } = string.Empty;

    [Column(TypeName = "decimal(4,2)")]
    public decimal Rating { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Image { get; set; } = string.Empty;

    [Required]
    [MaxLength(1600)]
    public string Content { get; set; } = string.Empty;

    [Required]
    [MaxLength(160)]
    public string LocationName { get; set; } = string.Empty;

    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public bool IsLiked { get; set; }
    public bool IsSaved { get; set; }
    public bool IsRestaurantPost { get; set; } = false;
    public bool IsApproved { get; set; } = false;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
