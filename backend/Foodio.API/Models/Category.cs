using System.ComponentModel.DataAnnotations;

namespace Foodio.API.Models;

public class Category
{
    public int Id { get; set; }

    [Required]
    [MaxLength(80)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(32)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(120)]
    public string? Icon { get; set; }

    public ICollection<Restaurant> Restaurants { get; set; } = new List<Restaurant>();
}
