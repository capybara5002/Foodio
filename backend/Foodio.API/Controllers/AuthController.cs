using Foodio.API.Data;
using Foodio.API.DTOs;
using Foodio.API.Models;
using Foodio.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Google.Apis.Auth;
using System.Security.Cryptography;
using System.Text.Json;
using BC = BCrypt.Net.BCrypt;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    [HttpPost("google")]
    public async Task<ActionResult<UserDto>> GoogleLogin(GoogleLoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Credential))
        {
            return BadRequest("Google credential is required.");
        }

        var clientId = _configuration["GoogleAuth:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, "Google login is not configured.");
        }

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                request.Credential,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { clientId }
                });
        }
        catch (InvalidJwtException)
        {
            return Unauthorized("Google credential is invalid or expired.");
        }

        if (!payload.EmailVerified || string.IsNullOrWhiteSpace(payload.Email))
        {
            return Unauthorized("Google email has not been verified.");
        }

        var email = payload.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);

        if (user != null && !user.IsActive)
        {
            return BadRequest("This account has been suspended by an Admin.");
        }

        if (user == null)
        {
            var username = string.IsNullOrWhiteSpace(payload.Name)
                ? email.Split('@')[0]
                : payload.Name.Trim();

            user = new User
            {
                Id = $"usr_{Guid.NewGuid():N}",
                Username = username[..Math.Min(username.Length, 100)],
                Email = email,
                PasswordHash = BC.HashPassword(Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))),
                Role = "User",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                Avatar = payload.Picture
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }
        else if (string.IsNullOrWhiteSpace(user.Avatar) && !string.IsNullOrWhiteSpace(payload.Picture))
        {
            user.Avatar = payload.Picture;
            await _db.SaveChangesAsync();
        }

        return Ok(user.ToDto());
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(UserLoginRequestDto request)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        bool isValid = false;
        if (user != null)
        {
            if (user.PasswordHash.StartsWith("$2a$") || user.PasswordHash.StartsWith("$2b$") || user.PasswordHash.StartsWith("$2y$"))
            {
                try
                {
                    isValid = BC.Verify(request.Password, user.PasswordHash);
                }
                catch
                {
                    isValid = false;
                }
            }
            else
            {
                isValid = user.PasswordHash == request.Password;
            }
        }

        if (user == null || !isValid)
        {
            return BadRequest("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            return BadRequest("This account has been suspended by an Admin.");
        }

        return Ok(user.ToDto());
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(UserRegisterRequestDto request)
    {
        if (await _db.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower()))
        {
            return BadRequest("Email already exists.");
        }

        var user = new User
        {
            Id = $"usr_{Guid.NewGuid():N}",
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BC.HashPassword(request.Password),
            Role = "User",
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(user.ToDto());
    }

    [HttpGet("me/{userId}")]
    public async Task<ActionResult<UserDto>> GetProfile(string userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound("User not found.");
        }
        return Ok(user.ToDto());
    }

    [HttpPost("qr/generate")]
    public async Task<ActionResult<string>> GenerateQrToken(QrGenerateRequestDto request)
    {
        var restaurantExists = await _db.Restaurants.AnyAsync(r => r.Id == request.RestaurantId);
        if (!restaurantExists)
        {
            return NotFound("Restaurant not found.");
        }

        var payload = new QrPayload
        {
            RestaurantId = request.RestaurantId,
            TableNumber = request.TableNumber,
            Expiry = DateTimeOffset.UtcNow.AddDays(1)
        };

        var json = JsonSerializer.Serialize(payload);
        var encrypted = CryptographyHelper.Encrypt(json);

        return Ok(new { token = encrypted });
    }

    [HttpPost("qr/verify")]
    public async Task<ActionResult<QrVerifyResponseDto>> VerifyQrToken(QrVerifyRequestDto request)
    {
        try
        {
            var decryptedJson = CryptographyHelper.Decrypt(request.Token);
            var payload = JsonSerializer.Deserialize<QrPayload>(decryptedJson);

            if (payload == null)
            {
                return BadRequest("Invalid token format.");
            }

            if (payload.Expiry < DateTimeOffset.UtcNow)
            {
                return BadRequest("QR code has expired. Please request a new table QR code.");
            }

            var restaurant = await _db.Restaurants.FindAsync(payload.RestaurantId);
            if (restaurant == null)
            {
                return BadRequest("Restaurant associated with QR code no longer exists.");
            }

            return Ok(new QrVerifyResponseDto(
                payload.RestaurantId,
                restaurant.Name,
                payload.TableNumber,
                request.Token
            ));
        }
        catch (Exception)
        {
            return BadRequest("Failed to decrypt or verify QR session.");
        }
    }

    [HttpPost("update-password")]
    public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequestDto request)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null)
        {
            return NotFound("User not found.");
        }

        bool isValid = false;
        if (user.PasswordHash.StartsWith("$2a$") || user.PasswordHash.StartsWith("$2b$") || user.PasswordHash.StartsWith("$2y$"))
        {
            try
            {
                isValid = BC.Verify(request.CurrentPassword, user.PasswordHash);
            }
            catch
            {
                isValid = false;
            }
        }
        else
        {
            isValid = user.PasswordHash == request.CurrentPassword;
        }

        if (!isValid)
        {
            return BadRequest("Mật khẩu hiện tại không chính xác.");
        }

        user.PasswordHash = BC.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Password updated successfully." });
    }

    [HttpPost("update-avatar")]
    public async Task<ActionResult<UserDto>> UpdateAvatar([FromBody] UpdateAvatarRequestDto request)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null)
        {
            return NotFound("User not found.");
        }

        user.Avatar = request.Avatar;
        await _db.SaveChangesAsync();

        return Ok(user.ToDto());
    }

    [HttpPost("update-username")]
    public async Task<ActionResult<UserDto>> UpdateUsername([FromBody] UpdateUsernameRequestDto request)
    {
        var username = request.Username.Trim();
        if (username.Length < 2 || username.Length > 100)
        {
            return BadRequest("Username must be between 2 and 100 characters.");
        }

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null)
        {
            return NotFound("User not found.");
        }

        var isTaken = await _db.Users.AnyAsync(u =>
            u.Id != user.Id && u.Username.ToLower() == username.ToLower());
        if (isTaken)
        {
            return Conflict("This username is already in use.");
        }

        user.Username = username;
        await _db.SaveChangesAsync();

        return Ok(user.ToDto());
    }

    private class QrPayload
    {
        public string RestaurantId { get; set; } = string.Empty;
        public int TableNumber { get; set; }
        public DateTimeOffset Expiry { get; set; }
    }
}
