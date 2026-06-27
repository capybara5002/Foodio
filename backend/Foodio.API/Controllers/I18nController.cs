using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/i18n")]
public class I18nController : ControllerBase
{
    private static readonly Regex LanguageCodePattern = new(@"^[a-z]{2,3}(-[a-z]{2})?$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex InterpolationPattern = new(@"\{\{[^{}]+\}\}", RegexOptions.Compiled);
    private static readonly Regex NoTranslateSpanPattern = new(
        @"<span\s+class=""notranslate"">\s*(\{\{[^{}]+\}\})\s*</span>",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public I18nController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpPost("translate")]
    public async Task<ActionResult<AppTranslationResponse>> Translate(
        [FromBody] AppTranslationRequest request,
        CancellationToken cancellationToken)
    {
        var sourceLang = NormalizeLanguageCode(request.SourceLang, "en");
        var targetLang = NormalizeLanguageCode(request.TargetLang, string.Empty);

        if (string.IsNullOrWhiteSpace(targetLang))
        {
            return BadRequest("TargetLang is required.");
        }

        if (request.Entries is null || request.Entries.Count == 0)
        {
            return BadRequest("Entries are required.");
        }

        if (string.Equals(sourceLang, targetLang, StringComparison.OrdinalIgnoreCase))
        {
            return Ok(new AppTranslationResponse(sourceLang, targetLang, request.Entries, "source"));
        }

        var apiKey = _configuration["GoogleCloud:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            apiKey = Environment.GetEnvironmentVariable("GOOGLE_CLOUD_API_KEY");
        }

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, "Google Cloud API key is not configured.");
        }

        var translatedEntries = new Dictionary<string, string>(StringComparer.Ordinal);
        var client = _httpClientFactory.CreateClient();

        foreach (var batch in request.Entries.Chunk(90))
        {
            var keys = batch.Select(entry => entry.Key).ToArray();
            var values = batch.Select(entry => ProtectInterpolationTokens(entry.Value)).ToArray();
            var translations = await TranslateBatchWithGoogleAsync(
                client,
                apiKey,
                sourceLang,
                targetLang,
                values,
                cancellationToken);

            for (var index = 0; index < keys.Length; index += 1)
            {
                var translatedValue = index < translations.Count ? translations[index] : values[index];
                translatedEntries[keys[index]] = RestoreInterpolationTokens(translatedValue);
            }
        }

        return Ok(new AppTranslationResponse(sourceLang, targetLang, translatedEntries, "google-cloud"));
    }

    private static string NormalizeLanguageCode(string? value, string fallback)
    {
        var normalized = value?.Trim().ToLowerInvariant().Replace('_', '-');
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return fallback;
        }

        return LanguageCodePattern.IsMatch(normalized) ? normalized : fallback;
    }

    private static string ProtectInterpolationTokens(string text)
    {
        if (string.IsNullOrEmpty(text))
        {
            return string.Empty;
        }

        return InterpolationPattern.Replace(text, match =>
            $@"<span class=""notranslate"">{WebUtility.HtmlEncode(match.Value)}</span>");
    }

    private static string RestoreInterpolationTokens(string text)
    {
        var decoded = WebUtility.HtmlDecode(text);
        return NoTranslateSpanPattern.Replace(decoded, "$1").Trim();
    }

    private static async Task<IReadOnlyList<string>> TranslateBatchWithGoogleAsync(
        HttpClient client,
        string apiKey,
        string sourceLang,
        string targetLang,
        IReadOnlyList<string> values,
        CancellationToken cancellationToken)
    {
        using var googleRequest = new HttpRequestMessage(HttpMethod.Post, "https://translation.googleapis.com/language/translate/v2");
        googleRequest.Headers.Add("X-Goog-Api-Key", apiKey);
        googleRequest.Content = JsonContent.Create(new
        {
            q = values,
            source = sourceLang,
            target = targetLang,
            format = "html"
        });

        using var response = await client.SendAsync(googleRequest, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(await ReadGoogleErrorAsync(response, cancellationToken));
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        return document.RootElement
            .GetProperty("data")
            .GetProperty("translations")
            .EnumerateArray()
            .Select(translation => translation.GetProperty("translatedText").GetString() ?? string.Empty)
            .ToList();
    }

    private static async Task<string> ReadGoogleErrorAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(body))
        {
            return $"Google Cloud request failed with status {(int)response.StatusCode}.";
        }

        try
        {
            using var document = JsonDocument.Parse(body);
            if (document.RootElement.TryGetProperty("error", out var error) &&
                error.TryGetProperty("message", out var message))
            {
                return message.GetString() ?? body;
            }
        }
        catch (JsonException)
        {
            return body;
        }

        return body;
    }
}

public record AppTranslationRequest(
    string SourceLang,
    string TargetLang,
    Dictionary<string, string> Entries);

public record AppTranslationResponse(
    string SourceLang,
    string TargetLang,
    IReadOnlyDictionary<string, string> Entries,
    string Provider);
