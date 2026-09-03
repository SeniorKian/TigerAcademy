using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TigerApp.Domain.Entities;

namespace TigerApp.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        
        builder.HasKey(o => o.Id);
        
        builder.Property(o => o.Amount)
            .HasColumnType("decimal(18,2)");
        
        builder.Property(o => o.TrackingCode)
            .HasMaxLength(100);
        
        builder.Property(o => o.PaymentGateway)
            .HasMaxLength(50);
        
        builder.Property(o => o.PaymentReference)
            .HasMaxLength(100);
        
        builder.Property(o => o.Notes)
            .HasMaxLength(1000);
        
        builder.HasIndex(o => o.UserId);
        builder.HasIndex(o => o.Status);
        builder.HasIndex(o => o.CreatedAt);
        
        // Navigation
        builder.HasOne(o => o.Payment)
            .WithOne(p => p.Order)
            .HasForeignKey<Payment>(p => p.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
