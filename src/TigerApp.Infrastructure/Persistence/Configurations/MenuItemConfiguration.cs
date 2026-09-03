using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TigerApp.Domain.Entities;

namespace TigerApp.Infrastructure.Persistence.Configurations;

public class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> builder)
    {
        builder.ToTable("MenuItems");
        
        builder.HasKey(m => m.Id);
        
        builder.Property(m => m.Title)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.Property(m => m.Icon)
            .HasMaxLength(50);
        
        builder.Property(m => m.Link)
            .IsRequired()
            .HasMaxLength(200);
        
        builder.HasIndex(m => m.Order);
        
        // Self-referencing relationship
        builder.HasOne(m => m.Parent)
            .WithMany(m => m.Children)
            .HasForeignKey(m => m.ParentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
