#!/bin/bash
echo "========================================="
echo "  🐯 TigerApp - Build Script"
echo "========================================="
echo ""

# Step 1: Build Frontend
echo "📦 Step 1: Building React Frontend..."
cd tigerapp.client
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi
echo "✅ Frontend built successfully!"
echo ""

# Step 2: Copy to wwwroot
echo "📁 Step 2: Copying to wwwroot..."
cd ..
rm -rf src/TigerApp.Api/wwwroot
mkdir -p src/TigerApp.Api/wwwroot
cp -r tigerapp.client/dist/* src/TigerApp.Api/wwwroot/
echo "✅ Files copied to wwwroot!"
echo ""

# Step 3: Build Backend
echo "🔧 Step 3: Building .NET Backend..."
cd src/TigerApp.Api
dotnet build -q
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    exit 1
fi
echo "✅ Backend built successfully!"
echo ""

echo "========================================="
echo "  🎉 Build Complete!"
echo "========================================="
echo ""
echo "  Run: cd src/TigerApp.Api && dotnet run --urls http://localhost:5100"
echo "  Open: http://localhost:5100/login"
echo ""
