# Environment Variables Configuration untuk Cloud Run

## Required Environment Variables

Berikut adalah environment variables yang WAJIB dikonfigurasi:

### 1. DATABASE_URL (REQUIRED)
Connection string ke PostgreSQL database.

**Format Neon Database:**
```
postgresql://username:password@endpoint.neon.tech/database?sslmode=require
```

**Format Cloud SQL:**
```
postgresql://username:password@/database?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

**Format Standard PostgreSQL:**
```
postgresql://username:password@host:5432/database
```

### 2. SESSION_SECRET (REQUIRED)
Secret key untuk session management. Gunakan string random minimal 32 karakter.

**Generate dengan command:**
```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 3. JWT_SECRET (REQUIRED)
Secret key untuk JWT token generation.

**Generate dengan command yang sama seperti SESSION_SECRET**

### 4. CLOUDINARY_CLOUD_NAME (REQUIRED untuk file uploads)
Nama cloud Cloudinary Anda.

### 5. CLOUDINARY_API_KEY (REQUIRED untuk file uploads)
API Key dari Cloudinary.

### 6. CLOUDINARY_API_SECRET (REQUIRED untuk file uploads)
API Secret dari Cloudinary.

---

## Optional Environment Variables

### Email Configuration
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### API Integrations
```bash
# S&S Activewear Integration
SS_ACTIVEWEAR_ACCOUNT=your-account-number
SS_ACTIVEWEAR_API_KEY=your-api-key

# Anthropic AI (untuk AI features)
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Application Configuration
```bash
NODE_ENV=production
PORT=8080  # Cloud Run otomatis set, tidak perlu diubah
CLIENT_URL=https://your-service-url.run.app
DEFAULT_USER_ROLE=user
```

---

## Cara Set Environment Variables di Cloud Run

### Method 1: Menggunakan Secret Manager (RECOMMENDED untuk production)

1. **Create secrets:**
```bash
# Database URL
echo -n "postgresql://user:pass@host/db" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Session Secret
echo -n "your-32-char-random-string" | \
  gcloud secrets create SESSION_SECRET --data-file=-

# JWT Secret
echo -n "your-jwt-secret-string" | \
  gcloud secrets create JWT_SECRET --data-file=-

# Cloudinary credentials
echo -n "your-cloud-name" | \
  gcloud secrets create CLOUDINARY_CLOUD_NAME --data-file=-
echo -n "your-api-key" | \
  gcloud secrets create CLOUDINARY_API_KEY --data-file=-
echo -n "your-api-secret" | \
  gcloud secrets create CLOUDINARY_API_SECRET --data-file=-
```

2. **Deploy dengan secrets:**
```bash
gcloud run deploy swagsuite \
  --image gcr.io/PROJECT_ID/swagsuite:latest \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,\
SESSION_SECRET=SESSION_SECRET:latest,\
JWT_SECRET=JWT_SECRET:latest,\
CLOUDINARY_CLOUD_NAME=CLOUDINARY_CLOUD_NAME:latest,\
CLOUDINARY_API_KEY=CLOUDINARY_API_KEY:latest,\
CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET:latest
```

### Method 2: Set Langsung (untuk development/testing)

```bash
gcloud run deploy swagsuite \
  --image gcr.io/PROJECT_ID/swagsuite:latest \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "DATABASE_URL=postgresql://..." \
  --set-env-vars "SESSION_SECRET=your-secret" \
  --set-env-vars "JWT_SECRET=your-jwt-secret" \
  --set-env-vars "CLOUDINARY_CLOUD_NAME=your-cloud" \
  --set-env-vars "CLOUDINARY_API_KEY=your-key" \
  --set-env-vars "CLOUDINARY_API_SECRET=your-secret"
```

### Method 3: Update environments yang sudah ada

```bash
# Update single variable
gcloud run services update swagsuite \
  --update-env-vars DATABASE_URL="new-value"

# Update multiple variables
gcloud run services update swagsuite \
  --update-env-vars KEY1=value1,KEY2=value2

# Update from .env.yaml file
gcloud run services update swagsuite \
  --env-vars-file .env.yaml
```

### Method 4: Via Console (Web UI)

1. Buka [Cloud Run Console](https://console.cloud.google.com/run)
2. Click service name (swagsuite)
3. Click "EDIT & DEPLOY NEW REVISION"
4. Scroll ke "Variables & Secrets"
5. Add environment variables atau reference secrets
6. Click "DEPLOY"

---

## .env.yaml Example (untuk deployment)

```yaml
# .env.yaml
DATABASE_URL: postgresql://user:pass@host/db
SESSION_SECRET: your-session-secret-here
JWT_SECRET: your-jwt-secret-here
CLOUDINARY_CLOUD_NAME: your-cloud-name
CLOUDINARY_API_KEY: your-api-key
CLOUDINARY_API_SECRET: your-api-secret
NODE_ENV: production
```

**PENTING:** Jangan commit file ini ke git! Add ke .gitignore

---

## Verification

Test apakah environment variables sudah ter-set dengan benar:

```bash
# Check service configuration
gcloud run services describe swagsuite \
  --region asia-southeast2 \
  --format "yaml(spec.template.spec.containers[0].env)"

# Test health endpoint
SERVICE_URL=$(gcloud run services describe swagsuite \
  --region asia-southeast2 \
  --format 'value(status.url)')

curl $SERVICE_URL/api/health
```

---

## Troubleshooting

### Error: "Missing DATABASE_URL"
- Pastikan secret DATABASE_URL sudah dibuat di Secret Manager
- Atau set langsung dengan --set-env-vars

### Error: "Connection timeout" ke database
- Verifikasi format DATABASE_URL
- Untuk Cloud SQL, gunakan Unix socket connection
- Pastikan database accessible dari internet (untuk external DB)

### Error: "CLOUDINARY_API_KEY is required"
- Set semua 3 Cloudinary credentials
- Atau disable file upload feature sementara

---

## Security Best Practices

1. ✅ **ALWAYS use Secret Manager** untuk production secrets
2. ✅ **NEVER commit** .env files atau secrets ke git
3. ✅ **Rotate secrets** secara berkala
4. ✅ **Use different secrets** untuk development/staging/production
5. ✅ **Limit Secret Manager access** dengan IAM roles
6. ✅ **Enable audit logs** untuk secret access

---

## Quick Setup Script

```bash
#!/bin/bash
# setup-secrets.sh

PROJECT_ID=$(gcloud config get-value project)

# Prompt for values
read -sp "Enter DATABASE_URL: " DATABASE_URL
echo
read -sp "Enter SESSION_SECRET: " SESSION_SECRET
echo
read -sp "Enter JWT_SECRET: " JWT_SECRET
echo
read -p "Enter CLOUDINARY_CLOUD_NAME: " CLOUDINARY_CLOUD_NAME
read -sp "Enter CLOUDINARY_API_KEY: " CLOUDINARY_API_KEY
echo
read -sp "Enter CLOUDINARY_API_SECRET: " CLOUDINARY_API_SECRET
echo

# Create secrets
echo "Creating secrets..."
echo -n "$DATABASE_URL" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "$SESSION_SECRET" | gcloud secrets create SESSION_SECRET --data-file=-
echo -n "$JWT_SECRET" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "$CLOUDINARY_CLOUD_NAME" | gcloud secrets create CLOUDINARY_CLOUD_NAME --data-file=-
echo -n "$CLOUDINARY_API_KEY" | gcloud secrets create CLOUDINARY_API_KEY --data-file=-
echo -n "$CLOUDINARY_API_SECRET" | gcloud secrets create CLOUDINARY_API_SECRET --data-file=-

echo "✓ All secrets created successfully!"
```

Save script di atas sebagai `setup-secrets.sh`, chmod +x, dan jalankan untuk setup cepat.
