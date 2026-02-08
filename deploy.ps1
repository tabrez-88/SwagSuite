# SwagSuite - Cloud Run Deployment Script (PowerShell)
# Script ini membantu deploy aplikasi ke Google Cloud Run

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Blue
Write-Host "  SwagSuite - Cloud Run Deployment" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Check if gcloud is installed
try {
    $null = Get-Command gcloud -ErrorAction Stop
} catch {
    Write-Host "Error: gcloud CLI is not installed" -ForegroundColor Red
    Write-Host "Please install Google Cloud SDK from: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Check if docker is installed
try {
    $null = Get-Command docker -ErrorAction Stop
} catch {
    Write-Host "Error: Docker is not installed" -ForegroundColor Red
    Write-Host "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
}

# Get project ID
$PROJECT_ID = gcloud config get-value project 2>$null
if ([string]::IsNullOrEmpty($PROJECT_ID)) {
    Write-Host "No project selected. Please run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Using project: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Service configuration
$SERVICE_NAME = "swagsuite"
$REGION = "asia-southeast2"  # Jakarta region
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Build options
Write-Host "Build Options:" -ForegroundColor Blue
Write-Host "1. Build and deploy from local"
Write-Host "2. Deploy using Cloud Build (recommended)"
Write-Host "3. Only build Docker image (no deploy)"
Write-Host ""
$BUILD_OPTION = Read-Host "Select option (1-3)"

if ($BUILD_OPTION -eq "1") {
    # Build locally and deploy
    Write-Host "Building Docker image locally..." -ForegroundColor Yellow
    docker build -t "${IMAGE_NAME}:latest" .
    
    Write-Host "Pushing image to Container Registry..." -ForegroundColor Yellow
    gcloud auth configure-docker
    docker push "${IMAGE_NAME}:latest"
    
    Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow
    gcloud run deploy $SERVICE_NAME `
        --image "${IMAGE_NAME}:latest" `
        --platform managed `
        --region $REGION `
        --allow-unauthenticated `
        --memory 1Gi `
        --cpu 1 `
        --min-instances 0 `
        --max-instances 10 `
        --timeout 300
    
} elseif ($BUILD_OPTION -eq "2") {
    # Deploy using Cloud Build
    Write-Host "Deploying using Cloud Build..." -ForegroundColor Yellow
    gcloud builds submit --config cloudbuild.yaml
    
} elseif ($BUILD_OPTION -eq "3") {
    # Only build image
    Write-Host "Building Docker image..." -ForegroundColor Yellow
    docker build -t "${IMAGE_NAME}:latest" .
    Write-Host "✓ Image built successfully: ${IMAGE_NAME}:latest" -ForegroundColor Green
    Write-Host "To push manually, run: docker push ${IMAGE_NAME}:latest" -ForegroundColor Yellow
    exit 0
    
} else {
    Write-Host "Invalid option" -ForegroundColor Red
    exit 1
}

# Get service URL
Write-Host ""
Write-Host "✓ Deployment complete!" -ForegroundColor Green
Write-Host ""
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format "value(status.url)" 2>$null
if (![string]::IsNullOrEmpty($SERVICE_URL)) {
    Write-Host "Service URL: $SERVICE_URL" -ForegroundColor Green
    Write-Host ""
    Write-Host "Testing health endpoint..." -ForegroundColor Blue
    try {
        $response = Invoke-WebRequest -Uri "$SERVICE_URL/api/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Health check passed!" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠ Health check failed. Please check logs." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Blue
Write-Host "- View logs: gcloud run services logs read $SERVICE_NAME --region $REGION"
Write-Host "- Update service: gcloud run services update $SERVICE_NAME --region $REGION"
Write-Host "- Delete service: gcloud run services delete $SERVICE_NAME --region $REGION"
Write-Host ""
