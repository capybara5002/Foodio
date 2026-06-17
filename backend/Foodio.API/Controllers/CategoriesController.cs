using Foodio.API.Data;
using Foodio.API.DTOs;
using Foodio.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoriesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> GetAll()
    {
        var categories = await _db.Categories.AsNoTracking().OrderBy(category => category.Name).ToListAsync();
        return Ok(categories.Select(category => category.ToDto()).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        var category = await _db.Categories.AsNoTracking().FirstOrDefaultAsync(item => item.Id == id);
        return category is null ? NotFound() : Ok(category.ToDto());
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(CategoryDto dto)
    {
        var validationError = ValidateAndNormalize(dto, out var name, out var slug, out var icon);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        if (await _db.Categories.AnyAsync(category => category.Slug == slug))
        {
            return BadRequest("Category slug already exists.");
        }

        var category = new Category { Name = name, Slug = slug, Icon = icon };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = category.Id }, category.ToDto());
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CategoryDto dto)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null)
        {
            return NotFound();
        }

        var validationError = ValidateAndNormalize(dto, out var name, out var slug, out var icon);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        if (await _db.Categories.AnyAsync(item => item.Id != id && item.Slug == slug))
        {
            return BadRequest("Category slug already exists.");
        }

        category.Name = name;
        category.Slug = slug;
        category.Icon = icon;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null)
        {
            return NotFound();
        }

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static string? ValidateAndNormalize(CategoryDto dto, out string name, out string slug, out string? icon)
    {
        name = (dto.Name ?? string.Empty).Trim();
        slug = NormalizeSlug(dto.Slug, name);
        icon = string.IsNullOrWhiteSpace(dto.Icon) ? null : dto.Icon.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            return "Category name is required.";
        }

        if (name.Length > 80)
        {
            return "Category name must be 80 characters or fewer.";
        }

        if (icon?.Length > 120)
        {
            return "Category icon must be 120 characters or fewer.";
        }

        return null;
    }

    private static string NormalizeSlug(string? rawSlug, string name)
    {
        var source = string.IsNullOrWhiteSpace(rawSlug) ? name : rawSlug;
        var slugChars = source
            .Trim()
            .ToLowerInvariant()
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : '-')
            .ToArray();

        var slug = string.Join("-", new string(slugChars).Split('-', StringSplitOptions.RemoveEmptyEntries));
        if (string.IsNullOrWhiteSpace(slug))
        {
            slug = "category";
        }

        return slug.Length <= 32 ? slug : slug[..32].Trim('-');
    }
}
