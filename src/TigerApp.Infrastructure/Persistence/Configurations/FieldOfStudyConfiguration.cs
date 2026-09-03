using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TigerApp.Domain.Entities;

namespace TigerApp.Infrastructure.Persistence.Configurations;

public class FieldOfStudyConfiguration : IEntityTypeConfiguration<FieldOfStudy>
{
    public void Configure(EntityTypeBuilder<FieldOfStudy> builder)
    {
        builder.ToTable("FieldsOfStudy");
        
        builder.HasKey(f => f.Id);
        
        builder.Property(f => f.Name)
            .IsRequired()
            .HasMaxLength(200);
        
        builder.Property(f => f.Code)
            .HasMaxLength(50);
        
        builder.HasIndex(f => f.Order);
    }
}
