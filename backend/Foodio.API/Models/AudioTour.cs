using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Foodio.API.Models;

public class AudioTour
{
    [Key]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(160)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(160)]
    public string Location { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Image { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string MapImage { get; set; } = string.Empty;

    public bool IsTrending { get; set; }

    [Column(TypeName = "decimal(3,2)")]
    public decimal Rating { get; set; }

    [Required]
    [MaxLength(40)]
    public string Duration { get; set; } = string.Empty;

    public int StopsCount { get; set; }

    [Required]
    [MaxLength(60)]
    public string Vibe { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    public string? AudioData { get; set; }
}
