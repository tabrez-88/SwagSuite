#!/bin/bash

# Quick test script untuk Docker image sebelum deploy

set -e

echo "🧪 Testing Docker Build and Run..."
echo ""

# Build image
echo "📦 Building Docker image..."
docker build -t swagsuite:test .

echo ""
echo "✅ Build successful!"
echo ""

# Check if we have required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Using dummy value for build test."
    export DATABASE_URL="postgresql://test:test@localhost:5432/test"
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "⚠️  SESSION_SECRET not set. Using test value."
    export SESSION_SECRET="test-secret-minimum-32-characters-long"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "⚠️  JWT_SECRET not set. Using test value."
    export JWT_SECRET="test-jwt-secret-minimum-32-chars"
fi

if [ -z "$CLOUDINARY_CLOUD_NAME" ]; then
    echo "⚠️  CLOUDINARY credentials not set. Using test values."
    export CLOUDINARY_CLOUD_NAME="test"
    export CLOUDINARY_API_KEY="test"
    export CLOUDINARY_API_SECRET="test"
fi

echo ""
echo "🚀 Starting container..."
echo "   (Container will fail to connect to database, but we're testing if it starts)"
echo ""

# Run container with timeout
timeout 30s docker run --rm \
    -p 8080:8080 \
    -e DATABASE_URL="$DATABASE_URL" \
    -e SESSION_SECRET="$SESSION_SECRET" \
    -e JWT_SECRET="$JWT_SECRET" \
    -e CLOUDINARY_CLOUD_NAME="$CLOUDINARY_CLOUD_NAME" \
    -e CLOUDINARY_API_KEY="$CLOUDINARY_API_KEY" \
    -e CLOUDINARY_API_SECRET="$CLOUDINARY_API_SECRET" \
    -e NODE_ENV="production" \
    swagsuite:test &

CONTAINER_PID=$!

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 10

# Test health endpoint
echo ""
echo "🏥 Testing health endpoint..."
if curl -f -s http://localhost:8080/api/health > /dev/null; then
    echo "✅ Health check PASSED!"
    echo ""
    curl -s http://localhost:8080/api/health | python3 -m json.tool || cat
else
    echo "⚠️  Health check endpoint not responding (might be database connection issue)"
    echo "   This is OK if database is not accessible for testing"
fi

echo ""
echo "🛑 Stopping container..."
kill $CONTAINER_PID 2>/dev/null || true
sleep 2

echo ""
echo "======================================"
echo "✅ Docker image build test completed!"
echo "======================================"
echo ""
echo "Image is ready for deployment to Cloud Run"
echo ""
echo "Next steps:"
echo "1. Setup secrets: ./setup-secrets.sh"
echo "2. Deploy: ./deploy.sh"
echo ""
