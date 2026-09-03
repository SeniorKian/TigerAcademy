using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TigerApp.Domain.Entities;

namespace TigerApp.Infrastructure.Persistence.Configurations;

public class ContentConfiguration : IEntityTypeConfiguration<Content>
{
    public void Configure(EntityTypeBuilder<Content> builder)
    {
        builder.ToTable("Contents");
        
        builder.HasKey(c => c.Id);
        
        builder.Property(c => c.Key)
            .IsRequired()
            .HasMaxLength(200);
        
        builder.Property(c => c.Value)
            .IsRequired()
            .HasMaxLength(4000);
        
        builder.Property(c => c.Page)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.Property(c => c.Section)
            .HasMaxLength(100);
        
        builder.Property(c => c.Language)
            .HasMaxLength(10);
        
        builder.HasIndex(c => new { c.Key, c.Page, c.Language })
            .IsUnique();
        
        builder.HasIndex(c => c.Page);
    }
}
