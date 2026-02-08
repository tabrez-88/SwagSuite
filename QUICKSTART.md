# ⚡ Quick Start - Deploy ke Google Cloud Run

Panduan singkat untuk deploy SwagSuite ke Cloud Run dalam 10 menit.

## 📋 Checklist Persiapan

### ✅ 1. Install Prerequisites
- [ ] Google Cloud SDK installed (`gcloud --version`)
- [ ] Docker installed (`docker --version`)
- [ ] Google Cloud project sudah dibuat
- [ ] Billing enabled di project

### ✅ 2. Setup Google Cloud
```bash
# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Set region
gcloud config set run/region asia-southeast2

# Enable APIs
gcloud services enable run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

### ✅ 3. Setup Database
- [ ] Database PostgreSQL sudah siap (Neon/Cloud SQL/External)
- [ ] Connection string sudah didapat
- [ ] Database accessible dari internet

### ✅ 4. Setup Cloudinary
- [ ] Cloudinary account sudah dibuat
- [ ] Cloud Name, API Key, API Secret sudah didapat

### ✅ 5. Create Secrets
```bash
# Generate secure secrets
SESSION_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Create secrets di Secret Manager
echo -n "YOUR_DATABASE_URL" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "$SESSION_SECRET" | gcloud secrets create SESSION_SECRET --data-file=-
echo -n "$JWT_SECRET" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "YOUR_CLOUD_NAME" | gcloud secrets create CLOUDINARY_CLOUD_NAME --data-file=-
echo -n "YOUR_API_KEY" | gcloud secrets create CLOUDINARY_API_KEY --data-file=-
echo -n "YOUR_API_SECRET" | gcloud secrets create CLOUDINARY_API_SECRET --data-file=-
```

---

## 🚀 Deployment (Pilih salah satu)

### Option A: Deploy dengan Script (Termudah)

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows PowerShell:**
```powershell
.\deploy.ps1
```

### Option B: Deploy Manual Step-by-Step

```bash
# 1. Set variables
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="swagsuite"
REGION="asia-southeast2"

# 2. Build Docker image
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest .

# 3. Push ke Container Registry
gcloud auth configure-docker
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# 4. Deploy ke Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,\
SESSION_SECRET=SESSION_SECRET:latest,\
JWT_SECRET=JWT_SECRET:latest,\
CLOUDINARY_CLOUD_NAME=CLOUDINARY_CLOUD_NAME:latest,\
CLOUDINARY_API_KEY=CLOUDINARY_API_KEY:latest,\
CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET:latest
```

### Option C: Deploy dengan Cloud Build (CI/CD)

```bash
# Deploy langsung dari source code
gcloud builds submit --config cloudbuild.yaml
```

---

## ✅ Verification

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe swagsuite \
  --region asia-southeast2 \
  --format 'value(status.url)')

echo "Service URL: $SERVICE_URL"

# Test health endpoint
curl $SERVICE_URL/api/health

# Test di browser
echo "Open in browser: $SERVICE_URL"
```

Expected response dari health check:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "service": "swagsuite",
  "environment": "production"
}
```

---

## 🔄 Update Aplikasi

Setelah deployment pertama, untuk update aplikasi:

```bash
# Build new version
docker build -t gcr.io/$PROJECT_ID/swagsuite:latest .

# Push
docker push gcr.io/$PROJECT_ID/swagsuite:latest

# Deploy akan otomatis ambil latest image
gcloud run deploy swagsuite --image gcr.io/$PROJECT_ID/swagsuite:latest
```

Atau dengan Cloud Build:
```bash
gcloud builds submit --config cloudbuild.yaml
```

---

## 📊 Monitoring

```bash
# View logs real-time
gcloud run services logs tail swagsuite --region asia-southeast2

# View recent logs
gcloud run services logs read swagsuite --region asia-southeast2 --limit 50

# Open in console
echo "https://console.cloud.google.com/run/detail/asia-southeast2/swagsuite/logs"
```

---

## 🔧 Common Commands

```bash
# Update environment variable
gcloud run services update swagsuite --update-env-vars KEY=VALUE

# Update memory/CPU
gcloud run services update swagsuite --memory 2Gi --cpu 2

# Update scaling
gcloud run services update swagsuite --min-instances 1 --max-instances 20

# View service details
gcloud run services describe swagsuite --region asia-southeast2

# Delete service
gcloud run services delete swagsuite --region asia-southeast2
```

---

## 🆘 Troubleshooting Quick Fixes

### ❌ Service tidak bisa start (503 error)
```bash
# Check logs
gcloud run services logs read swagsuite --limit 100

# Common issues:
# 1. DATABASE_URL tidak di-set → Set dengan gcloud secrets
# 2. Database tidak accessible → Check firewall/connection string
# 3. Missing Cloudinary credentials → Set environment variables
```

### ❌ Database connection timeout
```bash
# Test connection dari local
docker run --rm -it postgres:15 psql "YOUR_DATABASE_URL"

# Jika berhasil, berarti masalah di environment variable
gcloud run services describe swagsuite --format "yaml(spec.template.spec.containers[0].env)"
```

### ❌ Out of memory
```bash
# Increase memory limit
gcloud run services update swagsuite --memory 2Gi
```

### ❌ Cold start lambat
```bash
# Set minimum instances
gcloud run services update swagsuite --min-instances 1
```

---

## 💰 Cost Optimization

### Development/Testing
```bash
gcloud run services update swagsuite \
  --min-instances 0 \
  --max-instances 5 \
  --memory 512Mi \
  --cpu 1
```

### Production (Low Traffic)
```bash
gcloud run services update swagsuite \
  --min-instances 1 \
  --max-instances 10 \
  --memory 1Gi \
  --cpu 1
```

### Production (High Traffic)
```bash
gcloud run services update swagsuite \
  --min-instances 2 \
  --max-instances 100 \
  --memory 2Gi \
  --cpu 2
```

---

## 🔒 Security Checklist

- [x] Secrets di-store di Secret Manager (bukan environment variables langsung)
- [ ] Enable Cloud Armor untuk DDoS protection
- [ ] Setup custom domain dengan SSL
- [ ] Configure CORS sesuai domain
- [ ] Enable audit logging
- [ ] Setup backup strategy untuk database
- [ ] Implement rate limiting
- [ ] Regular security updates

---

## 📚 Documentation Links

- **Full Deployment Guide**: [CLOUD_RUN_DEPLOYMENT.md](./CLOUD_RUN_DEPLOYMENT.md)
- **Environment Variables**: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- **Cloud Run Docs**: https://cloud.google.com/run/docs

---

## 🎉 Success!

Jika health check mengembalikan response yang valid, berarti aplikasi sudah berjalan!

**Next Steps:**
1. Setup custom domain (optional)
2. Configure CI/CD dari GitHub (optional)
3. Setup monitoring alerts
4. Configure database backup
5. Test semua fitur aplikasi

---

**Questions?** Check [CLOUD_RUN_DEPLOYMENT.md](./CLOUD_RUN_DEPLOYMENT.md) untuk panduan lengkap.
