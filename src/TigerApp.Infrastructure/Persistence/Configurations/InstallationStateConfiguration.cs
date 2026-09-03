using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TigerApp.Domain.Entities;

namespace TigerApp.Infrastructure.Persistence.Configurations;

public sealed class InstallationStateConfiguration : IEntityTypeConfiguration<InstallationState>
{
    public void Configure(EntityTypeBuilder<InstallationState> builder)
    {
        builder.ToTable("InstallationStates");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Key).IsRequired().HasMaxLength(32);
        builder.Property(x => x.InstallationId).IsRequired().HasMaxLength(64);
        builder.Property(x => x.SchemaVersion).IsRequired().HasMaxLength(100);
        builder.HasIndex(x => x.Key).IsUnique();
    }
}
