#!/bin/bash

# SwagSuite - Interactive Secrets Setup Script
# Script untuk setup secrets ke Google Secret Manager

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  SwagSuite - Secrets Setup${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}No project selected.${NC}"
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID
    gcloud config set project $PROJECT_ID
fi

echo -e "${GREEN}✓ Using project: $PROJECT_ID${NC}"
echo ""

# Enable Secret Manager API
echo -e "${YELLOW}Enabling Secret Manager API...${NC}"
gcloud services enable secretmanager.googleapis.com 2>/dev/null || true
echo ""

echo -e "${BLUE}Please provide the following information:${NC}"
echo ""

# DATABASE_URL
echo -e "${YELLOW}1. DATABASE_URL${NC}"
echo "   Format: postgresql://username:password@host:5432/database"
read -sp "   Enter DATABASE_URL: " DATABASE_URL
echo ""
echo ""

# SESSION_SECRET
echo -e "${YELLOW}2. SESSION_SECRET${NC}"
echo "   Generate new: openssl rand -base64 32"
echo "   Or press ENTER to auto-generate"
read -sp "   Enter SESSION_SECRET (or leave empty): " SESSION_SECRET
echo ""
if [ -z "$SESSION_SECRET" ]; then
    SESSION_SECRET=$(openssl rand -base64 32)
    echo -e "   ${GREEN}✓ Auto-generated${NC}"
fi
echo ""

# JWT_SECRET
echo -e "${YELLOW}3. JWT_SECRET${NC}"
echo "   Generate new: openssl rand -base64 32"
echo "   Or press ENTER to auto-generate"
read -sp "   Enter JWT_SECRET (or leave empty): " JWT_SECRET
echo ""
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo -e "   ${GREEN}✓ Auto-generated${NC}"
fi
echo ""

# CLOUDINARY_CLOUD_NAME
echo -e "${YELLOW}4. CLOUDINARY_CLOUD_NAME${NC}"
read -p "   Enter Cloudinary Cloud Name: " CLOUDINARY_CLOUD_NAME
echo ""

# CLOUDINARY_API_KEY
echo -e "${YELLOW}5. CLOUDINARY_API_KEY${NC}"
read -sp "   Enter Cloudinary API Key: " CLOUDINARY_API_KEY
echo ""
echo ""

# CLOUDINARY_API_SECRET
echo -e "${YELLOW}6. CLOUDINARY_API_SECRET${NC}"
read -sp "   Enter Cloudinary API Secret: " CLOUDINARY_API_SECRET
echo ""
echo ""

# Optional: SMTP settings
echo -e "${BLUE}Optional: Email Configuration${NC}"
read -p "Configure email settings? (y/N): " CONFIGURE_EMAIL
echo ""

if [[ "$CONFIGURE_EMAIL" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}7. SMTP_HOST${NC}"
    read -p "   Enter SMTP Host (e.g., smtp.sendgrid.net): " SMTP_HOST
    
    echo -e "${YELLOW}8. SMTP_PORT${NC}"
    read -p "   Enter SMTP Port (default: 587): " SMTP_PORT
    SMTP_PORT=${SMTP_PORT:-587}
    
    echo -e "${YELLOW}9. SMTP_USER${NC}"
    read -p "   Enter SMTP User: " SMTP_USER
    
    echo -e "${YELLOW}10. SMTP_PASS${NC}"
    read -sp "   Enter SMTP Password: " SMTP_PASS
    echo ""
    echo ""
fi

# Confirmation
echo -e "${YELLOW}============================================${NC}"
echo -e "${YELLOW}Ready to create secrets in project: $PROJECT_ID${NC}"
echo -e "${YELLOW}============================================${NC}"
read -p "Continue? (y/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Creating secrets...${NC}"
echo ""

# Create secrets
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    
    # Check if secret exists
    if gcloud secrets describe $secret_name &>/dev/null; then
        echo -e "${YELLOW}  Updating $secret_name...${NC}"
        echo -n "$secret_value" | gcloud secrets versions add $secret_name --data-file=-
    else
        echo -e "${GREEN}  Creating $secret_name...${NC}"
        echo -n "$secret_value" | gcloud secrets create $secret_name --data-file=-
    fi
}

# Required secrets
create_or_update_secret "DATABASE_URL" "$DATABASE_URL"
create_or_update_secret "SESSION_SECRET" "$SESSION_SECRET"
create_or_update_secret "JWT_SECRET" "$JWT_SECRET"
create_or_update_secret "CLOUDINARY_CLOUD_NAME" "$CLOUDINARY_CLOUD_NAME"
create_or_update_secret "CLOUDINARY_API_KEY" "$CLOUDINARY_API_KEY"
create_or_update_secret "CLOUDINARY_API_SECRET" "$CLOUDINARY_API_SECRET"

# Optional email secrets
if [[ "$CONFIGURE_EMAIL" =~ ^[Yy]$ ]]; then
    create_or_update_secret "SMTP_HOST" "$SMTP_HOST"
    create_or_update_secret "SMTP_PORT" "$SMTP_PORT"
    create_or_update_secret "SMTP_USER" "$SMTP_USER"
    create_or_update_secret "SMTP_PASS" "$SMTP_PASS"
fi

echo ""
echo -e "${GREEN}✓ All secrets created successfully!${NC}"
echo ""

# List secrets
echo -e "${BLUE}Created secrets:${NC}"
gcloud secrets list
echo ""

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Secrets Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Run deployment: ./deploy.sh"
echo "2. Or deploy manually with secrets reference"
echo ""
echo -e "${YELLOW}Example deploy command:${NC}"
echo "gcloud run deploy swagsuite \\"
echo "  --image gcr.io/$PROJECT_ID/swagsuite:latest \\"
echo "  --set-secrets DATABASE_URL=DATABASE_URL:latest,\\"
echo "SESSION_SECRET=SESSION_SECRET:latest,\\"
echo "JWT_SECRET=JWT_SECRET:latest,\\"
echo "CLOUDINARY_CLOUD_NAME=CLOUDINARY_CLOUD_NAME:latest,\\"
echo "CLOUDINARY_API_KEY=CLOUDINARY_API_KEY:latest,\\"
echo "CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET:latest"
echo ""
