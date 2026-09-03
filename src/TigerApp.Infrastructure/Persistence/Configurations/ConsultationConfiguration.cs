using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TigerApp.Domain.Entities;

namespace TigerApp.Infrastructure.Persistence.Configurations;

public class ConsultationConfiguration : IEntityTypeConfiguration<Consultation>
{
    public void Configure(EntityTypeBuilder<Consultation> builder)
    {
        builder.ToTable("Consultations");
        
        builder.HasKey(c => c.Id);
        
        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(200);
        
        builder.Property(c => c.City)
            .HasMaxLength(100);
        
        builder.Property(c => c.Price)
            .HasColumnType("decimal(18,2)");
        
        builder.Property(c => c.Description)
            .HasMaxLength(1000);
        
        builder.HasIndex(c => c.Order);
        
        // Navigation
        builder.HasMany(c => c.Orders)
            .WithOne(o => o.Consultation)
            .HasForeignKey(o => o.ConsultationId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
