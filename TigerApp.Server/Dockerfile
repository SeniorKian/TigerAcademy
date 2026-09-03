# ---- Stage 1: Install Node.js alongside .NET SDK ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
RUN apt-get update && \
    apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# ---- Stage 2: Build both frontend and backend ----
WORKDIR /src

# Copy project files first for better layer caching
COPY ["TigerApp.Server/TigerApp.Server.csproj", "TigerApp.Server/"]
COPY ["tigerapp.client/tigerapp.client.esproj", "tigerapp.client/"]
COPY ["tigerapp.client/package.json", "tigerapp.client/"]

# Restore .NET packages
RUN dotnet restore "TigerApp.Server/TigerApp.Server.csproj"

# Install npm dependencies (cached layer)
WORKDIR /src/tigerapp.client
RUN npm install

# Copy all source code
WORKDIR /src
COPY . .

# Build the .NET project (which triggers npm run build for the client)
WORKDIR /src/TigerApp.Server
ARG BUILD_CONFIGURATION=Release
RUN dotnet build "TigerApp.Server.csproj" -c $BUILD_CONFIGURATION -o /app/build

# ---- Stage 3: Publish ----
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "TigerApp.Server.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# ---- Stage 4: Final runtime image ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# The app serves both the API and the React SPA from port 8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "TigerApp.Server.dll"]
