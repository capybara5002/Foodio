using Foodio.API.Data;
using Foodio.API.Hubs;
using Foodio.API.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Cấu hình dịch vụ Localization (Shared Resource)
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddHttpClient();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

await DbInitializer.ApplyMigrationsAsync(app.Services);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("Frontend");

// Cấu hình Request Localization Middleware để nhận diện ngôn ngữ
var supportedCultures = new[] { "vi", "en" };
var localizationOptions = new RequestLocalizationOptions()
    .SetDefaultCulture("vi")
    .AddSupportedCultures(supportedCultures)
    .AddSupportedUICultures(supportedCultures);

localizationOptions.RequestCultureProviders.Clear();
localizationOptions.RequestCultureProviders.Add(new Microsoft.AspNetCore.Localization.AcceptLanguageHeaderRequestCultureProvider());

app.UseRequestLocalization(localizationOptions);

app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
