using System.Collections.Concurrent;

namespace Foodio.API.Services;

public class PresenceTracker
{
    private static readonly TimeSpan ActiveWindow = TimeSpan.FromSeconds(3);
    private readonly ConcurrentDictionary<string, PresenceEntry> _entries = new();

    public void RecordHeartbeat(string visitorId, string? role)
    {
        var isParticipant = !string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) &&
                            !string.Equals(role, "Owner", StringComparison.OrdinalIgnoreCase);

        _entries.AddOrUpdate(
            visitorId,
            _ => new PresenceEntry(DateTimeOffset.UtcNow, isParticipant),
            (_, _) => new PresenceEntry(DateTimeOffset.UtcNow, isParticipant));
    }

    public int GetCurrentParticipantCount()
    {
        var cutoff = DateTimeOffset.UtcNow.Subtract(ActiveWindow);

        foreach (var entry in _entries)
        {
            if (entry.Value.LastSeenAt < cutoff)
            {
                _entries.TryRemove(entry.Key, out _);
            }
        }

        return _entries.Values.Count(entry => entry.IsParticipant && entry.LastSeenAt >= cutoff);
    }

    private sealed record PresenceEntry(DateTimeOffset LastSeenAt, bool IsParticipant);
}
