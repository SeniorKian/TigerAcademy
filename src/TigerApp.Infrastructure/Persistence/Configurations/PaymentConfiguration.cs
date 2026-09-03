using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TigerApp.Domain.Entities;

namespace TigerApp.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");
        
        builder.HasKey(p => p.Id);
        
        builder.Property(p => p.Amount)
            .HasColumnType("decimal(18,2)");
        
        builder.Property(p => p.Gateway)
            .HasMaxLength(50);
        
        builder.Property(p => p.ReferenceId)
            .HasMaxLength(100);
        
        builder.Property(p => p.CardNumber)
            .HasMaxLength(20);
        
        builder.Property(p => p.BankReference)
            .HasMaxLength(100);
        
        builder.Property(p => p.ResponseJson)
            .HasMaxLength(4000);
        
        builder.HasIndex(p => p.OrderId);
    }
}
