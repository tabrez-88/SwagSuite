#!/bin/bash

# SwagSuite - Cloud Run Deployment Script
# Script ini membantu deploy aplikasi ke Google Cloud Run

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  SwagSuite - Cloud Run Deployment${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install Google Cloud SDK from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}No project selected. Please run: gcloud config set project YOUR_PROJECT_ID${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Using project: $PROJECT_ID${NC}"
echo ""

# Service configuration
SERVICE_NAME="swagsuite"
REGION="asia-southeast2"  # Jakarta region
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Build options
echo -e "${BLUE}Build Options:${NC}"
echo "1. Build and deploy from local"
echo "2. Deploy using Cloud Build (recommended)"
echo "3. Only build Docker image (no deploy)"
echo ""
read -p "Select option (1-3): " BUILD_OPTION

if [ "$BUILD_OPTION" == "1" ]; then
    # Build locally and deploy
    echo -e "${YELLOW}Building Docker image locally...${NC}"
    docker build -t $IMAGE_NAME:latest .
    
    echo -e "${YELLOW}Pushing image to Container Registry...${NC}"
    gcloud auth configure-docker
    docker push $IMAGE_NAME:latest
    
    echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
    gcloud run deploy $SERVICE_NAME \
        --image $IMAGE_NAME:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 1Gi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --timeout 300
    
elif [ "$BUILD_OPTION" == "2" ]; then
    # Deploy using Cloud Build
    echo -e "${YELLOW}Deploying using Cloud Build...${NC}"
    gcloud builds submit --config cloudbuild.yaml
    
elif [ "$BUILD_OPTION" == "3" ]; then
    # Only build image
    echo -e "${YELLOW}Building Docker image...${NC}"
    docker build -t $IMAGE_NAME:latest .
    echo -e "${GREEN}✓ Image built successfully: $IMAGE_NAME:latest${NC}"
    echo -e "${YELLOW}To push manually, run: docker push $IMAGE_NAME:latest${NC}"
    exit 0
    
else
    echo -e "${RED}Invalid option${NC}"
    exit 1
fi

# Get service URL
echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)' 2>/dev/null)
if [ ! -z "$SERVICE_URL" ]; then
    echo -e "${GREEN}Service URL: $SERVICE_URL${NC}"
    echo ""
    echo -e "${BLUE}Testing health endpoint...${NC}"
    if curl -s "$SERVICE_URL/api/health" > /dev/null; then
        echo -e "${GREEN}✓ Health check passed!${NC}"
    else
        echo -e "${YELLOW}⚠ Health check failed. Please check logs.${NC}"
    fi
fi

echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "- View logs: gcloud run services logs read $SERVICE_NAME --region $REGION"
echo "- Update service: gcloud run services update $SERVICE_NAME --region $REGION"
echo "- Delete service: gcloud run services delete $SERVICE_NAME --region $REGION"
echo ""
