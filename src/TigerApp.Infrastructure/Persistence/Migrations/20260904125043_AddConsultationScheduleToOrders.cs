using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TigerApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddConsultationScheduleToOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "PreferredDate",
                table: "Orders",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredTimeRange",
                table: "Orders",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_PreferredDate",
                table: "Orders",
                column: "PreferredDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_PreferredDate",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PreferredDate",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PreferredTimeRange",
                table: "Orders");
        }
    }
}
