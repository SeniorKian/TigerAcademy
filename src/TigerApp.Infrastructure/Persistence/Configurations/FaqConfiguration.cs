using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TigerApp.Domain.Entities;

namespace TigerApp.Infrastructure.Persistence.Configurations;

public class FaqConfiguration : IEntityTypeConfiguration<Faq>
{
    public void Configure(EntityTypeBuilder<Faq> builder)
    {
        builder.ToTable("Faqs");
        
        builder.HasKey(f => f.Id);
        
        builder.Property(f => f.Question)
            .IsRequired()
            .HasMaxLength(500);
        
        builder.Property(f => f.Answer)
            .IsRequired()
            .HasMaxLength(2000);
        
        builder.Property(f => f.Category)
            .HasMaxLength(100);
        
        builder.HasIndex(f => f.Order);
    }
}
