using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Foodio.API.Models;

public class MenuItem
{
    [Key]
    [MaxLength(64)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(140)]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "decimal(10,2)")]
    public decimal Price { get; set; }

    [Required]
    public string Image { get; set; } = string.Empty;

    [MaxLength(600)]
    public string? Description { get; set; }

    public bool IsAvailable { get; set; } = true;

    [Required]
    [MaxLength(64)]
    public string RestaurantId { get; set; } = string.Empty;

    public Restaurant? Restaurant { get; set; }
}
