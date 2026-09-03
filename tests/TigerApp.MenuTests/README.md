# Permanent menu deletion checks

Run from the repository root:

```powershell
dotnet run --project tests/TigerApp.MenuTests/TigerApp.MenuTests.csproj
```

The executable runs nine assertions against fresh in-memory SQLite databases. It never reads the application's database or calls a running server.

Covered: active/inactive leaf deletion; destination content preservation; unchanged soft-delete behavior; parent protection with active/inactive children; child-then-parent deletion; missing records; the restrictive database foreign key; explicit DELETE route and authorization metadata. Authorization metadata inspection is not a substitute for HTTP authorization tests.

Verified on 2026-09-03:

- All nine database/controller checks passed.
- Frontend build and targeted MenuPage lint passed; all 30 existing link tests passed.
- Unauthenticated DELETE to a non-existing ID on the new endpoint returned HTTP 401.
- Browser: cancellation preserved the record; attempting to delete a parent with an inactive child displayed the API error in SweetAlert. Deleting the child and then the parent removed both rows after reload.
- Confirmation layout checked at 1285×912 and 375×812; initial focus is on cancel, and focus moves to the page heading after deletion.
- Only the two newly created `[QA-DELETE-0903]` test records were permanently deleted. Existing menu records and destination contents were not changed.

The UI uses a dedicated red “حذف دائمی” button; the separate eye icon retains reversible activation/deactivation. Permanent deletion is authorized for the same Admin and ContentManager roles that already manage menus. A parent with any children cannot be permanently deleted.
