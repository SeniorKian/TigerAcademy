using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TigerApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UseDateForUserBirthday : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Existing values represent Iranian calendar dates. Convert them in a
            // deterministic time zone instead of relying on the database session.
            migrationBuilder.Sql("""
                ALTER TABLE "Users"
                ALTER COLUMN "Birthday" TYPE date
                USING ("Birthday" AT TIME ZONE 'Asia/Tehran')::date;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Users"
                ALTER COLUMN "Birthday" TYPE timestamp with time zone
                USING ("Birthday"::timestamp AT TIME ZONE 'Asia/Tehran');
                """);
        }
    }
}
