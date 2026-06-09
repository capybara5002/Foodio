using Foodio.API.Services;
using Microsoft.AspNetCore.SignalR;

namespace Foodio.API.Hubs;

public class ChatHub : Hub
{
    private readonly IChatService _chatService;

    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    public Task JoinThread(string threadId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, threadId);
    }

    public Task LeaveThread(string threadId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, threadId);
    }

    public Task JoinRestaurant(string restaurantId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, $"restaurant:{restaurantId}");
    }

    public async Task SendMessage(string threadId, string senderId, string content)
    {
        var message = await _chatService.CreateTextMessageAsync(threadId, senderId, content);
        if (message is null) return;

        await Clients.Group(threadId).SendAsync("ReceiveMessage", message);

        var thread = await _chatService.GetThreadAsync(threadId);
        if (thread is not null)
        {
            await Clients.Group(threadId).SendAsync("ThreadUpdated", thread);
            await Clients.Group($"restaurant:{thread.RestaurantId}").SendAsync("ThreadUpdated", thread);
        }
    }

    public async Task SendImageMessage(string threadId, string senderId, string imageData, string? imageFileName)
    {
        var message = await _chatService.CreateImageMessageAsync(threadId, senderId, imageData, imageFileName);
        if (message is null) return;

        await Clients.Group(threadId).SendAsync("ReceiveMessage", message);

        var thread = await _chatService.GetThreadAsync(threadId);
        if (thread is not null)
        {
            await Clients.Group(threadId).SendAsync("ThreadUpdated", thread);
            await Clients.Group($"restaurant:{thread.RestaurantId}").SendAsync("ThreadUpdated", thread);
        }
    }
}
