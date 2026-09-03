using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TigerApp.Domain.Entities;

namespace TigerApp.Infrastructure.Persistence.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");
        
        builder.HasKey(rt => rt.Id);
        
        builder.Property(rt => rt.Token)
            .IsRequired()
            .HasMaxLength(500);
        
        builder.Property(rt => rt.CreatedByIp)
            .HasMaxLength(100);
        
        builder.Property(rt => rt.RevokedByIp)
            .HasMaxLength(100);
        
        builder.Property(rt => rt.ReplacedByToken)
            .HasMaxLength(500);
        
        builder.HasIndex(rt => rt.Token)
            .IsUnique();
        
        builder.HasIndex(rt => rt.UserId);
        
        builder.HasIndex(rt => rt.ExpiresAt);
    }
}
