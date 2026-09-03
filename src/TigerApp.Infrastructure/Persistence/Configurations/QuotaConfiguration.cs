using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TigerApp.Domain.Entities;

namespace TigerApp.Infrastructure.Persistence.Configurations;

public class QuotaConfiguration : IEntityTypeConfiguration<Quota>
{
    public void Configure(EntityTypeBuilder<Quota> builder)
    {
        builder.ToTable("Quotas");
        
        builder.HasKey(q => q.Id);
        
        builder.Property(q => q.Name)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.Property(q => q.Description)
            .HasMaxLength(500);
        
        builder.HasIndex(q => q.Order);
    }
}
