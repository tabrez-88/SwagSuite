# 🚀 Panduan Deployment SwagSuite ke Google Cloud Run

Panduan lengkap untuk deploy aplikasi SwagSuite (Order Management System) ke Google Cloud Run.

## 📋 Daftar Isi

- [Prasyarat](#prasyarat)
- [Arsitektur Aplikasi](#arsitektur-aplikasi)
- [Persiapan Google Cloud](#persiapan-google-cloud)
- [Setup Database](#setup-database)
- [Konfigurasi Environment Variables](#konfigurasi-environment-variables)
- [Deployment Manual](#deployment-manual)
- [Deployment Otomatis (CI/CD)](#deployment-otomatis-cicd)
- [Monitoring dan Logging](#monitoring-dan-logging)
- [Troubleshooting](#troubleshooting)
- [Optimasi dan Best Practices](#optimasi-dan-best-practices)

---

## 🔧 Prasyarat

Sebelum memulai deployment, pastikan Anda memiliki:

### 1. Tools yang Dibutuhkan
```bash
# Install Google Cloud SDK
# Windows: Download dari https://cloud.google.com/sdk/docs/install
# Linux/Mac:
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Verifikasi instalasi
gcloud --version

# Install Docker
# https://docs.docker.com/get-docker/
docker --version
```

### 2. Akun Google Cloud
- Akun Google Cloud aktif dengan billing enabled
- Project ID yang sudah dibuat
- Akses ke Cloud Run API, Cloud Build API, dan Container Registry API

### 3. Database PostgreSQL
- Neon Database, Cloud SQL, atau PostgreSQL database yang accessible dari internet
- Connection string untuk DATABASE_URL

### 4. Service Eksternal (Opsional)
- Cloudinary account untuk file uploads
- SendGrid atau SMTP untuk email
- API keys lainnya sesuai kebutuhan

---

## 🏗️ Arsitektur Aplikasi

```
┌─────────────────┐
│   User/Client   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Cloud Run     │
│  (Container)    │
│                 │
│ ┌─────────────┐ │
│ │   Express   │ │
│ │   Server    │ │
│ └──────┬──────┘ │
│        │        │
│ ┌──────────────┐│
│ │ Static Files ││
│ │  (Vite App) ││
│ └──────────────┘│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   PostgreSQL    │
│    Database     │
│  (Neon/Cloud    │
│      SQL)       │
└─────────────────┘
```

---

## ☁️ Persiapan Google Cloud

### 1. Login ke Google Cloud

```bash
# Login ke Google Cloud
gcloud auth login

# Set project ID (ganti dengan project ID Anda)
gcloud config set project YOUR_PROJECT_ID

# Verifikasi project
gcloud config get-value project
```

### 2. Enable Required APIs

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Enable Cloud Build API (untuk CI/CD)
gcloud services enable cloudbuild.googleapis.com

# Enable Secret Manager API (untuk environment variables)
gcloud services enable secretmanager.googleapis.com
```

### 3. Set Default Region

```bash
# Set region (pilih yang terdekat dengan user Anda)
# Jakarta: asia-southeast2
# Singapore: asia-southeast1
# Tokyo: asia-northeast1
gcloud config set run/region asia-southeast2
```

---

## 🗄️ Setup Database

### Opsi 1: Menggunakan Neon Database (Recommended untuk Development)

1. Buat akun di [neon.tech](https://neon.tech)
2. Buat project baru
3. Copy connection string yang diberikan
4. Connection string format: `postgresql://user:password@endpoint.neon.tech/database?sslmode=require`

### Opsi 2: Menggunakan Cloud SQL (Recommended untuk Production)

```bash
# Create Cloud SQL instance
gcloud sql instances create swagsuite-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-southeast2 \
  --root-password=YOUR_STRONG_PASSWORD

# Create database
gcloud sql databases create swagsuite --instance=swagsuite-db

# Get connection name
gcloud sql instances describe swagsuite-db --format='value(connectionName)'

# Create user
gcloud sql users create swagsuite-user \
  --instance=swagsuite-db \
  --password=YOUR_USER_PASSWORD
```

### Opsi 3: Menggunakan External PostgreSQL

Pastikan database dapat diakses dari internet dan memiliki SSL enabled.

---

## 🔐 Konfigurasi Environment Variables

### 1. Buat File .env untuk Testing Lokal

```bash
# Copy dari example
cp .env.example .env
```

Edit `.env` dengan values yang sesuai:

```env
# Database Configuration (REQUIRED)
DATABASE_URL=postgresql://user:password@host:5432/database

# Server Configuration
PORT=8080
NODE_ENV=production

# Session Secret (REQUIRED - Generate secure random string)
SESSION_SECRET=your-secure-session-secret-min-32-characters

# JWT Secret (REQUIRED)
JWT_SECRET=your-jwt-secret-key

# Cloudinary Configuration (REQUIRED untuk file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration (Optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# API Keys (Optional)
SS_ACTIVEWEAR_ACCOUNT=your-account
SS_ACTIVEWEAR_API_KEY=your-api-key
ANTHROPIC_API_KEY=your-anthropic-key

# Frontend URL (untuk CORS)
CLIENT_URL=https://your-cloudrun-url.run.app
```

### 2. Simpan Secrets di Google Secret Manager

```bash
# Create secrets untuk sensitive data
echo -n "postgresql://user:pass@host/db" | \
  gcloud secrets create DATABASE_URL --data-file=-

echo -n "your-session-secret-here" | \
  gcloud secrets create SESSION_SECRET --data-file=-

echo -n "your-jwt-secret" | \
  gcloud secrets create JWT_SECRET --data-file=-

echo -n "your-cloudinary-cloud-name" | \
  gcloud secrets create CLOUDINARY_CLOUD_NAME --data-file=-

echo -n "your-cloudinary-api-key" | \
  gcloud secrets create CLOUDINARY_API_KEY --data-file=-

echo -n "your-cloudinary-api-secret" | \
  gcloud secrets create CLOUDINARY_API_SECRET --data-file=-

# List secrets untuk verifikasi
gcloud secrets list
```

---

## 🚢 Deployment Manual

### 1. Build Docker Image Lokal (Testing)

```bash
# Build image
docker build -t swagsuite:latest .

# Test run locally
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e SESSION_SECRET="your-secret" \
  -e JWT_SECRET="your-jwt-secret" \
  -e CLOUDINARY_CLOUD_NAME="your-cloud-name" \
  -e CLOUDINARY_API_KEY="your-api-key" \
  -e CLOUDINARY_API_SECRET="your-api-secret" \
  swagsuite:latest

# Test di browser: http://localhost:8080
```

### 2. Build dan Push ke Google Container Registry

```bash
# Set project ID
export PROJECT_ID=$(gcloud config get-value project)

# Build image dengan tag GCR
docker build -t gcr.io/$PROJECT_ID/swagsuite:latest .

# Configure Docker untuk GCR
gcloud auth configure-docker

# Push image ke GCR
docker push gcr.io/$PROJECT_ID/swagsuite:latest
```

### 3. Deploy ke Cloud Run

```bash
# Deploy dengan environment variables dari Secret Manager
gcloud run deploy swagsuite \
  --image gcr.io/$PROJECT_ID/swagsuite:latest \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,\
SESSION_SECRET=SESSION_SECRET:latest,\
JWT_SECRET=JWT_SECRET:latest,\
CLOUDINARY_CLOUD_NAME=CLOUDINARY_CLOUD_NAME:latest,\
CLOUDINARY_API_KEY=CLOUDINARY_API_KEY:latest,\
CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET:latest

# Atau deploy dengan environment variables langsung (tidak recommended untuk production)
gcloud run deploy swagsuite \
  --image gcr.io/$PROJECT_ID/swagsuite:latest \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "DATABASE_URL=postgresql://..." \
  --set-env-vars "SESSION_SECRET=your-secret" \
  --set-env-vars "JWT_SECRET=your-jwt-secret" \
  --set-env-vars "CLOUDINARY_CLOUD_NAME=your-cloud-name" \
  --set-env-vars "CLOUDINARY_API_KEY=your-api-key" \
  --set-env-vars "CLOUDINARY_API_SECRET=your-api-secret"
```

### 4. Verifikasi Deployment

```bash
# Get service URL
gcloud run services describe swagsuite \
  --region asia-southeast2 \
  --format 'value(status.url)'

# Test endpoint
SERVICE_URL=$(gcloud run services describe swagsuite \
  --region asia-southeast2 \
  --format 'value(status.url)')

curl $SERVICE_URL/api/health
```

---

## 🔄 Deployment Otomatis (CI/CD)

### Setup CI/CD dengan Cloud Build

#### 1. Grant Permissions ke Cloud Build

```bash
# Get Cloud Build service account
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant Cloud Run Admin role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/run.admin"

# Grant Service Account User role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/iam.serviceAccountUser"

# Grant Secret Manager Secret Accessor role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

#### 2. Setup Cloud Build Trigger

```bash
# Connect repository (GitHub, GitLab, Bitbucket)
# Ikuti wizard di console: https://console.cloud.google.com/cloud-build/triggers

# Atau create trigger via CLI
gcloud beta builds triggers create github \
  --name="swagsuite-deploy" \
  --repo-name="your-repo-name" \
  --repo-owner="your-github-username" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml"
```

#### 3. Test CI/CD

```bash
# Push ke branch main, Cloud Build akan otomatis:
# 1. Build Docker image
# 2. Push ke Container Registry
# 3. Deploy ke Cloud Run

git add .
git commit -m "Deploy to Cloud Run"
git push origin main

# Monitor build progress
gcloud builds list --limit 5
```

---

## 📊 Monitoring dan Logging

### 1. View Logs

```bash
# Stream logs real-time
gcloud run services logs tail swagsuite \
  --region asia-southeast2

# View recent logs
gcloud run services logs read swagsuite \
  --region asia-southeast2 \
  --limit 50
```

### 2. Monitoring di Console

Buka [Cloud Run Console](https://console.cloud.google.com/run):
- **Metrics**: Request count, latency, error rate, CPU/memory usage
- **Logs**: Detailed application logs
- **Revisions**: Version history dan rollback capability

### 3. Setup Alerts (Optional)

```bash
# Create alert for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="SwagSuite High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=300s
```

---

## 🔧 Troubleshooting

### Issue 1: Container Crashes on Startup

**Symptoms**: Service returns 503 errors

**Solutions**:
```bash
# Check logs
gcloud run services logs read swagsuite --region asia-southeast2 --limit 100

# Common causes:
# 1. Missing DATABASE_URL
# 2. Database connection failed
# 3. Port mismatch (harus 8080)
# 4. Missing required environment variables

# Verify environment variables
gcloud run services describe swagsuite \
  --region asia-southeast2 \
  --format 'value(spec.template.spec.containers[0].env)'
```

### Issue 2: Database Connection Timeout

**Symptoms**: Logs show "connection timeout" atau "ECONNREFUSED"

**Solutions**:
```bash
# 1. Verifikasi DATABASE_URL format
# 2. Pastikan database accessible dari internet
# 3. Check firewall rules
# 4. Untuk Cloud SQL, enable Cloud SQL Admin API

# Test database connection
docker run --rm -it postgres:15 psql $DATABASE_URL
```

### Issue 3: File Uploads Not Working

**Symptoms**: Error saat upload files

**Solutions**:
- Verifikasi Cloudinary credentials
- Check environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- Verify Cloudinary account limits

### Issue 4: Cold Start Issues

**Symptoms**: First request after idle period is slow

**Solutions**:
```bash
# Set minimum instances to 1 (akan ada biaya)
gcloud run services update swagsuite \
  --region asia-southeast2 \
  --min-instances 1

# Atau gunakan Cloud Scheduler untuk keep-alive
gcloud scheduler jobs create http keep-alive-swagsuite \
  --schedule="*/5 * * * *" \
  --uri="https://your-service-url.run.app/api/health" \
  --http-method=GET
```

### Issue 5: Memory Limit Exceeded

**Symptoms**: Container killed with "out of memory" error

**Solutions**:
```bash
# Increase memory limit
gcloud run services update swagsuite \
  --region asia-southeast2 \
  --memory 2Gi
```

---

## ⚡ Optimasi dan Best Practices

### 1. Resource Allocation

```bash
# Untuk production dengan traffic rendah-sedang
gcloud run services update swagsuite \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10

# Untuk production dengan traffic tinggi
gcloud run services update swagsuite \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 2 \
  --max-instances 100
```

### 2. Cost Optimization

```bash
# Development/Staging: Scale to zero
gcloud run services update swagsuite-dev \
  --min-instances 0 \
  --max-instances 5

# Production: Minimal always-on
gcloud run services update swagsuite \
  --min-instances 1 \
  --max-instances 10
```

### 3. Security Best Practices

```bash
# 1. Gunakan Secret Manager untuk sensitive data
# 2. Enable Cloud Armor untuk DDoS protection
# 3. Setup Cloud CDN untuk static assets
# 4. Implement authentication/authorization
# 5. Regular security updates

# Restrict access (jika tidak public)
gcloud run services remove-iam-policy-binding swagsuite \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --region asia-southeast2

# Grant access ke specific users
gcloud run services add-iam-policy-binding swagsuite \
  --member="user:email@example.com" \
  --role="roles/run.invoker" \
  --region asia-southeast2
```

### 4. Database Migration

```bash
# Jalankan migrations sebelum deployment
# Option 1: Manual migration
gcloud run services update swagsuite \
  --region asia-southeast2 \
  --command="npm run db:migrate"

# Option 2: Add migration step di cloudbuild.yaml
# Option 3: Run migration dari local
npm run db:migrate
```

### 5. Backup Strategy

```bash
# Untuk Cloud SQL
gcloud sql backups create \
  --instance=swagsuite-db \
  --description="Pre-deployment backup"

# List backups
gcloud sql backups list --instance=swagsuite-db

# Restore dari backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=swagsuite-db \
  --backup-id=BACKUP_ID
```

### 6. Custom Domain

```bash
# Map custom domain ke Cloud Run
gcloud run domain-mappings create \
  --service swagsuite \
  --domain your-domain.com \
  --region asia-southeast2

# Update DNS records sesuai instruksi yang diberikan
```

---

## 📝 Quick Reference

### Common Commands

```bash
# Deploy
gcloud run deploy swagsuite --source .

# Update environment variable
gcloud run services update swagsuite \
  --update-env-vars KEY=VALUE

# View logs
gcloud run services logs read swagsuite

# Delete service
gcloud run services delete swagsuite

# List services
gcloud run services list

# Describe service
gcloud run services describe swagsuite
```

### Cost Estimation

**Free Tier** (per month):
- 2 million requests
- 360,000 GB-seconds
- 180,000 vCPU-seconds
- 1 GB network egress

**Estimated Monthly Cost** (after free tier):
- Low traffic (< 100k requests/month): $0 - $5
- Medium traffic (1M requests/month): $10 - $30
- High traffic (10M requests/month): $100 - $300

---

## 🆘 Support dan Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Container Registry Documentation](https://cloud.google.com/container-registry/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)

---

## ✅ Checklist Deployment

- [ ] Google Cloud Project sudah dibuat
- [ ] Billing enabled di project
- [ ] APIs sudah di-enable (Cloud Run, Container Registry, Cloud Build)
- [ ] Database PostgreSQL sudah siap dan accessible
- [ ] Environment variables sudah dikonfigurasi
- [ ] Secrets sudah disimpan di Secret Manager
- [ ] Dockerfile dan .dockerignore sudah ada
- [ ] Build dan test Docker image secara lokal
- [ ] Push image ke Container Registry
- [ ] Deploy ke Cloud Run
- [ ] Test aplikasi di Cloud Run URL
- [ ] Setup monitoring dan logging
- [ ] Setup CI/CD (optional)
- [ ] Setup custom domain (optional)
- [ ] Setup backup strategy

---

**Selamat! 🎉 Aplikasi SwagSuite Anda sudah berjalan di Google Cloud Run!**

Untuk pertanyaan atau bantuan lebih lanjut, silakan hubungi tim development.
