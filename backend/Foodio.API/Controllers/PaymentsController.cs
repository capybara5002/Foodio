using System.Globalization;
using System.Security.Cryptography;
using Foodio.API.Data;
using Foodio.API.DTOs;
using Foodio.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private const int PassHours = 24;
    private const decimal CustomerAmount = 19000m;
    private const decimal OwnerAmount = 49000m;
    private readonly AppDbContext _db;

    public PaymentsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("intent")]
    public async Task<ActionResult<PaymentSessionDto>> CreateIntent(PaymentIntentRequestDto request)
    {
        var accessType = NormalizeAccessType(request.AccessType);
        var amount = accessType == "Owner" ? OwnerAmount : CustomerAmount;
        var reference = $"FOODIO-{DateTimeOffset.UtcNow:yyMMdd}-{RandomNumberGenerator.GetInt32(100000, 1000000)}";
        var clientToken = Guid.NewGuid().ToString("N");

        var session = new PaymentSession
        {
            Id = $"pay_{Guid.NewGuid():N}",
            ClientToken = clientToken,
            AccessType = accessType,
            Amount = amount,
            Currency = "VND",
            Status = "Pending",
            Provider = "DemoQR",
            PaymentReference = reference,
            QrPayload = BuildQrPayload(reference, amount, accessType),
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.PaymentSessions.Add(session);
        await _db.SaveChangesAsync();

        return Ok(session.ToDto());
    }

    [HttpPost("confirm")]
    public async Task<ActionResult<PaymentSessionDto>> Confirm(PaymentConfirmRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.ClientToken))
        {
            return BadRequest("Payment token is required.");
        }

        var session = await _db.PaymentSessions.FirstOrDefaultAsync(item => item.ClientToken == request.ClientToken);
        if (session is null)
        {
            return NotFound("Payment session not found.");
        }

        var now = DateTimeOffset.UtcNow;
        if (session.Status == "Paid" && session.ExpiresAt > now)
        {
            return Ok(session.ToDto());
        }

        if (session.Status == "Expired")
        {
            return BadRequest("Payment session has expired. Please create a new payment QR.");
        }

        session.Status = "Paid";
        session.Provider = string.IsNullOrWhiteSpace(request.Method) ? "DemoQR" : request.Method.Trim();
        session.PaidAt = now;
        session.ExpiresAt = now.AddHours(PassHours);
        session.LastValidatedAt = now;

        await _db.SaveChangesAsync();

        return Ok(session.ToDto());
    }

    [HttpPost("validate")]
    public async Task<ActionResult<PaymentSessionDto?>> Validate(PaymentValidateRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.ClientToken))
        {
            return Ok(null);
        }

        var session = await _db.PaymentSessions.FirstOrDefaultAsync(item => item.ClientToken == request.ClientToken);
        if (session is null)
        {
            return Ok(null);
        }

        var now = DateTimeOffset.UtcNow;
        if (session.Status == "Paid" && session.ExpiresAt <= now)
        {
            session.Status = "Expired";
            await _db.SaveChangesAsync();
        }
        else if (session.Status == "Paid")
        {
            session.LastValidatedAt = now;
            await _db.SaveChangesAsync();
        }

        return Ok(session.ToDto());
    }

    private static string NormalizeAccessType(string? accessType)
    {
        return string.Equals(accessType, "Owner", StringComparison.OrdinalIgnoreCase)
            ? "Owner"
            : "Customer";
    }

    private static string BuildQrPayload(string reference, decimal amount, string accessType)
    {
        var amountText = amount.ToString("0", CultureInfo.InvariantCulture);
        return $"FOODIO_PAYMENT|provider=DemoQR|ref={reference}|amount={amountText}|currency=VND|access={accessType}|validHours={PassHours}";
    }
}
