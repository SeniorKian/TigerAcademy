using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TigerApp.Domain.Entities;

namespace TigerApp.Infrastructure.Persistence.Configurations;

public class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    public void Configure(EntityTypeBuilder<Plan> builder)
    {
        builder.ToTable("Plans");
        
        builder.HasKey(p => p.Id);
        
        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);
        
        builder.Property(p => p.Description)
            .HasMaxLength(2000);
        
        builder.Property(p => p.Price)
            .HasColumnType("decimal(18,2)");
        
        builder.Property(p => p.ImageUrl)
            .HasMaxLength(500);
        
        builder.Property(p => p.VideoUrl)
            .HasMaxLength(500);
        
        builder.Property(p => p.Features)
            .HasMaxLength(4000);
        
        builder.HasIndex(p => p.Order);
        
        // Navigation
        builder.HasMany(p => p.Orders)
            .WithOne(o => o.Plan)
            .HasForeignKey(o => o.PlanId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
