using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;

namespace Foodio.API.Controllers;

[ApiController]
[Route("api/audio-guide")]
public class AudioGuideController : ControllerBase
{
    private static readonly IReadOnlyDictionary<string, string> SpeechLocales = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["en"] = "en-US",
        ["ko"] = "ko-KR",
        ["ja"] = "ja-JP",
        ["fr"] = "fr-FR",
        ["zh"] = "cmn-CN",
        ["vi"] = "vi-VN",
        ["es"] = "es-ES",
        ["de"] = "de-DE",
        ["it"] = "it-IT",
        ["pt"] = "pt-BR",
        ["ru"] = "ru-RU",
        ["ar"] = "ar-XA",
        ["hi"] = "hi-IN",
        ["bn"] = "bn-IN",
        ["ur"] = "ur-IN",
        ["id"] = "id-ID",
        ["ms"] = "ms-MY",
        ["th"] = "th-TH",
        ["nl"] = "nl-NL",
        ["sv"] = "sv-SE",
        ["da"] = "da-DK",
        ["fi"] = "fi-FI",
        ["pl"] = "pl-PL",
        ["cs"] = "cs-CZ",
        ["sk"] = "sk-SK",
        ["hu"] = "hu-HU",
        ["ro"] = "ro-RO",
        ["bg"] = "bg-BG",
        ["uk"] = "uk-UA",
        ["tr"] = "tr-TR",
        ["el"] = "el-GR",
        ["he"] = "he-IL",
        ["ta"] = "ta-IN",
        ["te"] = "te-IN",
        ["mr"] = "mr-IN",
        ["gu"] = "gu-IN",
        ["pa"] = "pa-IN",
        ["kn"] = "kn-IN",
        ["ml"] = "ml-IN",
        ["ne"] = "ne-NP",
        ["sr"] = "sr-RS",
        ["hr"] = "hr-HR"
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public AudioGuideController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpPost("narrate")]
    public async Task<ActionResult<AudioGuideNarrationResponse>> Narrate(
        [FromBody] AudioGuideNarrationRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest("Text is required.");
        }

        if (string.IsNullOrWhiteSpace(request.TargetLang))
        {
            return BadRequest("TargetLang is required.");
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

        var sourceText = request.Text.Trim();
        var targetLang = request.TargetLang.Trim().ToLowerInvariant();
        var client = _httpClientFactory.CreateClient();

        var translatedText = await TranslateWithGoogleAsync(client, apiKey, sourceText, targetLang, cancellationToken);
        var locale = SpeechLocales.TryGetValue(targetLang, out var mappedLocale) ? mappedLocale : targetLang;
        var chunks = SplitTextForSpeech(translatedText);
        var audioSegments = new List<string>();

        foreach (var chunk in chunks)
        {
            var audioContent = await SynthesizeWithGoogleAsync(client, apiKey, chunk, locale, cancellationToken);
            if (!string.IsNullOrWhiteSpace(audioContent))
            {
                audioSegments.Add(audioContent);
            }
        }

        if (audioSegments.Count == 0)
        {
            return StatusCode(StatusCodes.Status502BadGateway, "Google Cloud TTS returned no audio.");
        }

        return Ok(new AudioGuideNarrationResponse(
            translatedText,
            audioSegments,
            "audio/mpeg",
            "google-cloud",
            locale));
    }

    private static async Task<string> TranslateWithGoogleAsync(
        HttpClient client,
        string apiKey,
        string sourceText,
        string targetLang,
        CancellationToken cancellationToken)
    {
        var url = $"https://translation.googleapis.com/language/translate/v2?key={Uri.EscapeDataString(apiKey)}";
        using var response = await client.PostAsJsonAsync(url, new
        {
            q = sourceText,
            target = targetLang,
            format = "text"
        }, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(await ReadGoogleErrorAsync(response, cancellationToken));
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var translatedText = document.RootElement
            .GetProperty("data")
            .GetProperty("translations")[0]
            .GetProperty("translatedText")
            .GetString();

        return WebUtility.HtmlDecode(translatedText ?? sourceText).Trim();
    }

    private static async Task<string> SynthesizeWithGoogleAsync(
        HttpClient client,
        string apiKey,
        string text,
        string locale,
        CancellationToken cancellationToken)
    {
        var url = $"https://texttospeech.googleapis.com/v1/text:synthesize?key={Uri.EscapeDataString(apiKey)}";
        using var response = await client.PostAsJsonAsync(url, new
        {
            input = new { text },
            voice = new
            {
                languageCode = locale,
                ssmlGender = "NEUTRAL"
            },
            audioConfig = new
            {
                audioEncoding = "MP3",
                speakingRate = 0.95
            }
        }, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(await ReadGoogleErrorAsync(response, cancellationToken));
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        return document.RootElement.TryGetProperty("audioContent", out var audioContent)
            ? audioContent.GetString() ?? string.Empty
            : string.Empty;
    }

    private static IReadOnlyList<string> SplitTextForSpeech(string text)
    {
        var matches = Regex.Matches(text, @"[^.!?。！？]+[.!?。！？]*|.{1,900}");
        return matches
            .Select(match => match.Value.Trim())
            .Where(chunk => !string.IsNullOrWhiteSpace(chunk))
            .SelectMany(chunk => chunk.Length <= 900 ? new[] { chunk } : ChunkByLength(chunk, 900))
            .ToList();
    }

    private static IEnumerable<string> ChunkByLength(string text, int maxLength)
    {
        for (var index = 0; index < text.Length; index += maxLength)
        {
            yield return text.Substring(index, Math.Min(maxLength, text.Length - index));
        }
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

    public record AudioGuideNarrationRequest(string Text, string TargetLang);

    public record AudioGuideNarrationResponse(
        string TranslatedText,
        IReadOnlyList<string> AudioSegments,
        string AudioMimeType,
        string Provider,
        string Locale);
}
