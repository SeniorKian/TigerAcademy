var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// Serve React SPA static files
app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
	app.MapOpenApi();
	app.UseHttpsRedirection();
}

app.UseAuthorization();

app.MapControllers();

// SPA fallback - any non-API route serves index.html
app.MapFallbackToFile("/index.html");

app.Run();
