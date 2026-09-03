using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using TigerApp.Api.Controllers;
using TigerApp.Domain.Entities;
using TigerApp.Infrastructure.Persistence.Context;
using TigerApp.Infrastructure.Persistence.Repositories;
using TigerApp.Infrastructure.Persistence.UnitOfWork;

// Isolated, real SQLite tests: no production connection, HTTP requests or user data.
var passed = 0;
await Run("Permanent delete removes an active leaf but keeps destination content", async (db, controller) =>
{
    var item = new MenuItem { Title = "Test leaf", Link = "/page/test", IsActive = true };
    var content = new Content { Key = "test.title", Page = "test", Value = "Keep me", IsActive = true };
    db.AddRange(item, content); await db.SaveChangesAsync();
    Check(await controller.DeletePermanently(item.Id, default) is OkObjectResult, "Expected success");
    Check(!await db.MenuItems.AnyAsync(x => x.Id == item.Id), "Row still exists");
    Check(await db.Contents.AnyAsync(x => x.Id == content.Id && x.Value == "Keep me"), "Destination content changed");
});
await Run("Permanent delete also removes inactive leaves", async (db, controller) =>
{
    var item = new MenuItem { Title = "Inactive", Link = "/", IsActive = false };
    db.Add(item); await db.SaveChangesAsync();
    Check(await controller.DeletePermanently(item.Id, default) is OkObjectResult, "Expected success");
    Check(!await db.MenuItems.AnyAsync(), "Inactive row remains");
});
await Run("Existing delete endpoint remains reversible", async (db, controller) =>
{
    var item = new MenuItem { Title = "Reversible", Link = "/", IsActive = true };
    db.Add(item); await db.SaveChangesAsync();
    Check(await controller.Delete(item.Id) is OkObjectResult, "Expected success");
    Check(await db.MenuItems.AnyAsync(x => x.Id == item.Id && !x.IsActive), "Soft delete removed the row");
});
foreach (var active in new[] { true, false })
{
    await Run($"Parent deletion blocked when child IsActive={active}", async (db, controller) =>
    {
        var parent = new MenuItem { Title = "Parent", Link = "/" };
        var child = new MenuItem { Title = "Child", Link = "/", Parent = parent, IsActive = active };
        db.AddRange(parent, child); await db.SaveChangesAsync(); db.ChangeTracker.Clear();
        Check(await controller.DeletePermanently(parent.Id, default) is ConflictObjectResult, "Parent should be blocked");
        Check(await db.MenuItems.CountAsync() == 2, "Parent or child changed");
    });
}
await Run("Delete child then parent succeeds without cascading", async (db, controller) =>
{
    var parent = new MenuItem { Title = "Parent", Link = "/" };
    var child = new MenuItem { Title = "Child", Link = "/", Parent = parent };
    db.AddRange(parent, child); await db.SaveChangesAsync(); db.ChangeTracker.Clear();
    Check(await controller.DeletePermanently(child.Id, default) is OkObjectResult, "Child delete failed");
    Check(await db.MenuItems.CountAsync() == 1, "Parent was removed with child");
    Check(await controller.DeletePermanently(parent.Id, default) is OkObjectResult, "Parent delete failed");
    Check(!await db.MenuItems.AnyAsync(), "Rows remain");
});
await Run("Missing or already deleted item returns 404", async (_, controller) =>
{
    Check(await controller.DeletePermanently(int.MaxValue, default) is NotFoundObjectResult, "Expected 404");
});
await Run("Database FK independently prevents orphaned children", async (db, _) =>
{
    var parent = new MenuItem { Title = "Parent", Link = "/" };
    db.Add(new MenuItem { Title = "Child", Link = "/", Parent = parent });
    await db.SaveChangesAsync(); db.ChangeTracker.Clear();
    var repository = new Repository<MenuItem>(db);
    await repository.PermanentlyDeleteAsync((await repository.GetByIdAsync(parent.Id))!);
    var blocked = false;
    try { await db.SaveChangesAsync(); }
    catch (DbUpdateException error) when (error.InnerException is SqliteException { SqliteErrorCode: 19 }) { blocked = true; }
    Check(blocked, "FK did not reject deletion");
    db.ChangeTracker.Clear();
    Check(await db.MenuItems.CountAsync() == 2, "FK failure changed rows");
});
await Run("Permanent endpoint has explicit route and authorized menu roles", (_, _) =>
{
    var method = typeof(MenuController).GetMethod(nameof(MenuController.DeletePermanently))!;
    Check(method.GetCustomAttribute<HttpDeleteAttribute>()?.Template == "{id:int}/permanent", "Wrong route");
    Check(method.GetCustomAttribute<AuthorizeAttribute>()?.Roles == "Admin,ContentManager", "Wrong role policy");
    Check(method.GetCustomAttribute<AllowAnonymousAttribute>() == null, "Anonymous deletion allowed");
    return Task.CompletedTask;
});
Console.WriteLine($"{passed} menu deletion checks passed.");

async Task Run(string name, Func<TigerAppDbContext, MenuController, Task> test)
{
    await using var connection = new SqliteConnection("Data Source=:memory:;Foreign Keys=True");
    await connection.OpenAsync();
    await using var db = new TigerAppDbContext(new DbContextOptionsBuilder<TigerAppDbContext>().UseSqlite(connection).Options);
    await db.Database.EnsureCreatedAsync();
    await test(db, new MenuController(new UnitOfWork(db)));
    Console.WriteLine($"PASS: {name}"); passed++;
}
static void Check(bool condition, string message)
{
    if (!condition) throw new InvalidOperationException(message);
}
