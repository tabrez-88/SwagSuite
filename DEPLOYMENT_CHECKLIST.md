# 📋 Deployment Checklist untuk Google Cloud Run

## ✅ Pre-Deployment Checklist

### 1. Prerequisites
- [ ] Google Cloud SDK terpasang (`gcloud --version`)
- [ ] Docker terpasang (`docker --version`)
- [ ] Google Cloud Project sudah dibuat
- [ ] Billing enabled di project
- [ ] Git repository sudah di-push

### 2. Google Cloud Configuration
- [ ] Login ke gcloud (`gcloud auth login`)
- [ ] Set project ID (`gcloud config set project PROJECT_ID`)
- [ ] Set default region (`gcloud config set run/region asia-southeast2`)
- [ ] Enable required APIs:
  - [ ] Cloud Run API
  - [ ] Container Registry API
  - [ ] Cloud Build API
  - [ ] Secret Manager API

### 3. Database Setup
- [ ] PostgreSQL database sudah provisioned
- [ ] Database accessible dari internet (atau setup Cloud SQL)
- [ ] Database connection string didapat
- [ ] Migrations sudah dijalankan (lokal atau akan dijalankan setelah deploy)
- [ ] Database user memiliki permission yang cukup

### 4. Cloudinary Setup (untuk file uploads)
- [ ] Cloudinary account sudah dibuat
- [ ] Cloud Name didapat
- [ ] API Key didapat
- [ ] API Secret didapat

### 5. Secrets Configuration
- [ ] DATABASE_URL created di Secret Manager
- [ ] SESSION_SECRET created (32+ random characters)
- [ ] JWT_SECRET created (32+ random characters)
- [ ] CLOUDINARY_CLOUD_NAME created
- [ ] CLOUDINARY_API_KEY created
- [ ] CLOUDINARY_API_SECRET created
- [ ] (Optional) Email secrets created

**Quick Setup:**
```bash
./setup-secrets.sh
```

---

## 🚀 Deployment Checklist

### Option A: Automated Deployment Script
- [ ] Make script executable (`chmod +x deploy.sh`)
- [ ] Run deployment script (`./deploy.sh`)
- [ ] Select deployment option
- [ ] Wait for completion

### Option B: Manual Deployment
- [ ] Build Docker image locally
- [ ] Test image locally
- [ ] Push image to GCR
- [ ] Deploy to Cloud Run with secrets
- [ ] Verify deployment

### Option C: CI/CD with Cloud Build
- [ ] Review cloudbuild.yaml configuration
- [ ] Grant permissions to Cloud Build service account
- [ ] Setup Cloud Build trigger (optional)
- [ ] Trigger build (`gcloud builds submit`)

---

## ✅ Post-Deployment Checklist

### 1. Verification
- [ ] Service deployed successfully
- [ ] Service URL obtained
- [ ] Health check endpoint responds (`/api/health`)
- [ ] Database connection working
- [ ] File uploads working (Cloudinary)
- [ ] Authentication working
- [ ] Test basic CRUD operations

### 2. Configuration
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (auto by Cloud Run)
- [ ] CORS configured properly
- [ ] Environment variables correct
- [ ] Secrets accessible

### 3. Monitoring Setup
- [ ] Logs accessible di Cloud Console
- [ ] Metrics dashboard checked
- [ ] Alerts configured (optional)
- [ ] Uptime monitoring enabled (optional)

### 4. Security
- [ ] Secrets dalam Secret Manager (not env vars)
- [ ] Non-root user dalam container
- [ ] HTTPS enforced
- [ ] No sensitive data dalam logs
- [ ] IAM permissions properly configured
- [ ] Firewall rules checked (untuk database)

### 5. Performance
- [ ] Memory allocation appropriate (1Gi default)
- [ ] CPU allocation appropriate (1 CPU default)
- [ ] Min/max instances configured
- [ ] Timeout appropriate (300s default)
- [ ] Cold start acceptable

### 6. Backup & Recovery
- [ ] Database backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Rollback procedure tested
- [ ] Previous revision available

---

## 🔍 Testing Checklist

### Basic Tests
```bash
# Health check
curl https://YOUR-SERVICE-URL.run.app/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","service":"swagsuite","environment":"production"}
```

### Functional Tests
- [ ] User can login
- [ ] User can create order
- [ ] User can upload file
- [ ] User can view dashboard
- [ ] Email notifications working (if enabled)
- [ ] All critical features working

### Performance Tests
- [ ] Response time acceptable (<2s for most requests)
- [ ] Cold start time acceptable (<5s)
- [ ] Load testing completed (optional)
- [ ] Stress testing completed (optional)

---

## 📊 Monitoring Checklist

### Daily
- [ ] Check error rate dalam logs
- [ ] Review cloud run metrics
- [ ] Check database performance

### Weekly
- [ ] Review cost breakdown
- [ ] Check security alerts
- [ ] Review access logs
- [ ] Verify backups working

### Monthly
- [ ] Review resource usage trends
- [ ] Update dependencies
- [ ] Security patches applied
- [ ] Performance optimization review

---

## 🔄 Update Deployment Checklist

Untuk update aplikasi setelah deployment awal:

- [ ] Code changes committed dan tested locally
- [ ] Database migrations created (jika ada schema changes)
- [ ] Run migrations (sebelum atau sesudah deploy)
- [ ] Build new Docker image
- [ ] Tag dengan version/commit hash
- [ ] Push ke Container Registry
- [ ] Deploy ke Cloud Run
- [ ] Verify new version working
- [ ] Monitor for errors post-deployment
- [ ] Rollback jika ada issue critical

**Quick update command:**
```bash
# Deploy dengan tag latest
./deploy.sh

# Atau manual
docker build -t gcr.io/$PROJECT_ID/swagsuite:latest .
docker push gcr.io/$PROJECT_ID/swagsuite:latest
gcloud run deploy swagsuite --image gcr.io/$PROJECT_ID/swagsuite:latest
```

---

## 🆘 Troubleshooting Checklist

Jika ada masalah:

### Service tidak start (503)
- [ ] Check logs: `gcloud run services logs read swagsuite --limit 100`
- [ ] Verify DATABASE_URL set correctly
- [ ] Verify database accessible
- [ ] Check all required secrets present
- [ ] Verify port 8080 exposed dalam Dockerfile

### Database connection failed
- [ ] Verify connection string format
- [ ] Test connection dari local
- [ ] Check database firewall rules
- [ ] Verify SSL required/not required
- [ ] Check database credentials

### File upload failed
- [ ] Verify Cloudinary credentials
- [ ] Check Cloudinary account limits
- [ ] Verify CLOUDINARY_* environment variables
- [ ] Test Cloudinary API directly

### Out of memory
- [ ] Increase memory: `gcloud run services update swagsuite --memory 2Gi`
- [ ] Review memory usage patterns
- [ ] Check for memory leaks
- [ ] Optimize code

### Cold start too slow
- [ ] Set min-instances to 1 (costs more)
- [ ] Optimize Docker image size
- [ ] Review application startup time
- [ ] Consider keep-alive ping

---

## 📋 Production Readiness Checklist

Sebelum go-live production:

### Technical
- [ ] All tests passing
- [ ] Performance tested
- [ ] Security audit completed
- [ ] Backups configured dan tested
- [ ] Monitoring dan alerting active
- [ ] Documentation complete
- [ ] Error handling comprehensive
- [ ] Logging appropriate (tidak terlalu verbose)

### Business
- [ ] Stakeholders informed
- [ ] Support team trained
- [ ] Rollback plan ready
- [ ] Incident response plan documented
- [ ] Budget approved
- [ ] Legal/compliance requirements met

### Operations
- [ ] On-call rotation defined
- [ ] Runbooks created
- [ ] Access controls configured
- [ ] Backup/restore tested
- [ ] Disaster recovery plan
- [ ] Communication channels established

---

## ✅ SUMMARY

**Minimal untuk deployment:**
1. ✅ Google Cloud project dengan billing
2. ✅ Database PostgreSQL
3. ✅ Cloudinary account
4. ✅ Secrets di Secret Manager
5. ✅ Docker image built dan pushed
6. ✅ Cloud Run service deployed
7. ✅ Health check passing

**Waktu estimasi:** 15-30 menit untuk first-time deployment

**Biaya estimasi:** 
- Development: $0-5/month (mostly free tier)
- Production low-traffic: $10-30/month
- Production high-traffic: $100-500/month

---

**Questions?** Lihat dokumentasi lengkap:
- [QUICKSTART.md](./QUICKSTART.md)
- [CLOUD_RUN_DEPLOYMENT.md](./CLOUD_RUN_DEPLOYMENT.md)
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
