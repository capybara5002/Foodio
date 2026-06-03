using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Foodio.API.Models;

public class FoodStreet
{
    public int Id { get; set; }

    [Required]
    [MaxLength(140)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string District { get; set; } = string.Empty;

    [MaxLength(600)]
    public string Description { get; set; } = string.Empty;

    [Column(TypeName = "decimal(9,6)")]
    public decimal CenterLatitude { get; set; }

    [Column(TypeName = "decimal(9,6)")]
    public decimal CenterLongitude { get; set; }

    [MaxLength(80)]
    public string OpeningWindow { get; set; } = string.Empty;

    public ICollection<Restaurant> Restaurants { get; set; } = new List<Restaurant>();
}
