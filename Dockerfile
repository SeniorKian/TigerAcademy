# Self-contained app image: React SPA + ASP.NET Core API, built in one `docker build`.
# No database is bundled here — provide it at `docker run` time via env vars, e.g.:
#   docker run -p 5100:5100 --env-file .env tigerapp
# Required env vars (see .env.example):
#   ConnectionStrings__DefaultConnection  -> full Npgsql connection string to your PostgreSQL server
#   JwtSettings__Secret                   -> random string, at least 32 characters

# Stage 1: Build React frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/tigerapp.client
COPY tigerapp.client/package*.json ./
RUN npm ci
COPY tigerapp.client/ ./
RUN npm run build

# Stage 2: Build .NET backend
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /src
COPY src/TigerApp.Domain/TigerApp.Domain.csproj src/TigerApp.Domain/
COPY src/TigerApp.Application/TigerApp.Application.csproj src/TigerApp.Application/
COPY src/TigerApp.Infrastructure/TigerApp.Infrastructure.csproj src/TigerApp.Infrastructure/
COPY src/TigerApp.Api/TigerApp.Api.csproj src/TigerApp.Api/
RUN dotnet restore src/TigerApp.Api/TigerApp.Api.csproj
COPY src/ src/
RUN dotnet publish src/TigerApp.Api/TigerApp.Api.csproj -c Release -o /app/publish --no-restore

# Stage 3: Final image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Copy published backend
COPY --from=backend-build /app/publish ./

# Copy frontend build to wwwroot
RUN mkdir -p wwwroot
COPY --from=frontend-build /app/tigerapp.client/dist/ wwwroot/

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p App_Data logs \
    && chown -R app:app /app \
    && chmod 700 App_Data
USER app

# Expose port
EXPOSE 5100

# Set environment variables
ENV ASPNETCORE_URLS=http://+:5100
ENV ASPNETCORE_ENVIRONMENT=Production

# Works without Docker Compose too, since curl and the /health endpoint live in this image already.
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl --fail --silent http://localhost:5100/health || exit 1

ENTRYPOINT ["dotnet", "TigerApp.Api.dll"]
