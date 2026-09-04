using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TigerApp.Domain.Entities;

namespace TigerApp.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        
        builder.HasKey(u => u.Id);
        
        builder.Property(u => u.PhoneNumber)
            .IsRequired()
            .HasMaxLength(20);
        
        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(500);
        
        builder.Property(u => u.FirstName)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.Property(u => u.LastName)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.Property(u => u.Email)
            .HasMaxLength(256);
        
        builder.Property(u => u.PhoneNumber2)
            .HasMaxLength(20);
        
        builder.Property(u => u.Province)
            .HasMaxLength(100);
        
        builder.Property(u => u.City)
            .HasMaxLength(100);
        
        builder.Property(u => u.FieldOfStudy)
            .HasMaxLength(200);
        
        builder.Property(u => u.Quota)
            .HasMaxLength(100);
        
        builder.Property(u => u.TelegramId)
            .HasMaxLength(100);

        // A birthday is a calendar date, not an instant in a time zone. Mapping it
        // to PostgreSQL date also avoids Npgsql rejecting DateTimeKind.Unspecified.
        builder.Property(u => u.Birthday)
            .HasColumnType("date");
        
        builder.HasIndex(u => u.PhoneNumber)
            .IsUnique();
        
        builder.HasIndex(u => u.Email)
            .IsUnique();
        
        // Navigation
        builder.HasMany(u => u.Orders)
            .WithOne(o => o.User)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.HasMany(u => u.RefreshTokens)
            .WithOne(rt => rt.User)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
