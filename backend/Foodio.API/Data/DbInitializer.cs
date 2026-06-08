using Microsoft.EntityFrameworkCore;

namespace Foodio.API.Data;

public static class DbInitializer
{
    public static async Task ApplyMigrationsAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            await context.Users.AnyAsync();
            await context.PostComments.AnyAsync();
        }
        catch (Exception)
        {
            try
            {
                await context.Database.EnsureDeletedAsync();
            }
            catch (Exception) { }
            await context.Database.EnsureCreatedAsync();
        }
    }
}
