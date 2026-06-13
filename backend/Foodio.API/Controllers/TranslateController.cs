using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/translate")]
public class TranslateController : ControllerBase
{
    private const string SystemInstruction =
        "You are an elite multilingual tour guide translator. Translate the given text into the target ISO language code. Keep local culinary terms natural and accurate. Output ONLY the raw translated string response without markdown or conversational filler.";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public TranslateController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpPost]
    public async Task<ActionResult<string>> Translate([FromBody] TranslateRequestDto request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest("Text is required.");
        }

        if (string.IsNullOrWhiteSpace(request.TargetLang))
        {
            return BadRequest("TargetLang is required.");
        }

        var sourceText = request.Text.Trim();
        var targetLang = request.TargetLang.Trim().ToLowerInvariant();

        var apiKey = _configuration["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        }

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Ok(sourceText);
        }

        var model = _configuration["Gemini:Model"];
        if (string.IsNullOrWhiteSpace(model))
        {
            model = "gemini-2.5-flash";
        }

        var payload = new
        {
            system_instruction = new
            {
                parts = new[]
                {
                    new { text = SystemInstruction }
                }
            },
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[]
                    {
                        new
                        {
                            text = $"Target ISO language code: {targetLang}\n\nText:\n{sourceText}"
                        }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0.2,
                maxOutputTokens = 900
            }
        };

        try
        {
            var client = _httpClientFactory.CreateClient();
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(model)}:generateContent?key={Uri.EscapeDataString(apiKey)}";
            using var response = await client.PostAsJsonAsync(url, payload, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode(StatusCodes.Status502BadGateway, "Gemini translation request failed.");
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var translated = ExtractGeminiText(document.RootElement);

            if (string.IsNullOrWhiteSpace(translated))
            {
                return StatusCode(StatusCodes.Status502BadGateway, "Gemini returned an empty translation.");
            }

            return Ok(translated.Trim());
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, $"Translation service unavailable: {ex.Message}");
        }
    }

    private static string? ExtractGeminiText(JsonElement root)
    {
        if (!root.TryGetProperty("candidates", out var candidates) ||
            candidates.ValueKind != JsonValueKind.Array ||
            candidates.GetArrayLength() == 0)
        {
            return null;
        }

        var firstCandidate = candidates[0];
        if (!firstCandidate.TryGetProperty("content", out var content) ||
            !content.TryGetProperty("parts", out var parts) ||
            parts.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var chunks = new List<string>();
        foreach (var part in parts.EnumerateArray())
        {
            if (part.TryGetProperty("text", out var textElement))
            {
                var text = textElement.GetString();
                if (!string.IsNullOrWhiteSpace(text))
                {
                    chunks.Add(text);
                }
            }
        }

        return chunks.Count == 0 ? null : string.Join(string.Empty, chunks);
    }

    public record TranslateRequestDto(string Text, string TargetLang);
}
