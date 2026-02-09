# ⚡ Quick Start - Deploy SwagSuite ke Google Cloud Run

Panduan lengkap step-by-step untuk deploy SwagSuite ke Google Cloud Run.

> **📍 Semua command dijalankan dari Command Prompt (CMD) Windows**, kecuali disebutkan lain.

---

## 📋 Prerequisites

### 1. Install Google Cloud SDK

Download dan install dari: https://cloud.google.com/sdk/docs/install

Setelah install, buka **Command Prompt** dan verifikasi:
```cmd
gcloud --version
```

---

## 🔐 Step 1: Login & Setup Project

Buka **Command Prompt (CMD)** dan jalankan satu per satu:

```cmd
gcloud auth login
```
Browser akan terbuka, login dengan akun Google yang punya akses ke GCP project.

```cmd
gcloud config set project YOUR_PROJECT_ID
```
Ganti `YOUR_PROJECT_ID` dengan project ID kamu (contoh: `oms-swagsuite`).

```cmd
gcloud config set run/region asia-southeast2
```

---

## 🔌 Step 2: Enable Required APIs

Copy-paste command ini (satu baris):
```cmd
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com
```

---

## 🔑 Step 3: Grant Permissions

**PENTING:** Dapatkan Project Number dulu:
```cmd
gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)"
```
Catat nomor yang muncul (contoh: `488131124182`).

Lalu jalankan SEMUA command ini. **Ganti `YOUR_PROJECT_ID` dan `YOUR_PROJECT_NUMBER`:**

```cmd
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
```

```cmd
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" --role="roles/storage.objectAdmin"
```

```cmd
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="serviceAccount:YOUR_PROJECT_NUMBER@cloudbuild.gserviceaccount.com" --role="roles/run.admin"
```

```cmd
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="serviceAccount:YOUR_PROJECT_NUMBER@cloudbuild.gserviceaccount.com" --role="roles/iam.serviceAccountUser"
```

---

## 🗝️ Step 4: Create Secrets

Buat secrets satu per satu. **Ganti nilai dalam tanda kutip dengan nilai sebenarnya.**

### 4.1 DATABASE_URL
```cmd
gcloud secrets create DATABASE_URL --data-file=-
```
Ketik/paste connection string database kamu (contoh):
```
postgresql://user:password@host:5432/database?sslmode=require
```
Tekan **Ctrl+Z** lalu **Enter**.

### 4.2 SESSION_SECRET
```cmd
gcloud secrets create SESSION_SECRET --data-file=-
```
Ketik random string 32 karakter (contoh): `aB3xY9kL2mN7pQ4rS8tU1vW6zC5dE0fG`
Tekan **Ctrl+Z** lalu **Enter**.

### 4.3 JWT_SECRET
```cmd
gcloud secrets create JWT_SECRET --data-file=-
```
Ketik random string 32 karakter (berbeda dari SESSION_SECRET): `hJ2kM5nP8qR1sT4uV7wX0yZ3aB6cD9eF`
Tekan **Ctrl+Z** lalu **Enter**.

### 4.4 CLOUDINARY_CLOUD_NAME
```cmd
gcloud secrets create CLOUDINARY_CLOUD_NAME --data-file=-
```
Ketik cloud name dari Cloudinary dashboard, tekan **Ctrl+Z** lalu **Enter**.

### 4.5 CLOUDINARY_API_KEY
```cmd
gcloud secrets create CLOUDINARY_API_KEY --data-file=-
```
Ketik API key dari Cloudinary dashboard, tekan **Ctrl+Z** lalu **Enter**.

### 4.6 CLOUDINARY_API_SECRET
```cmd
gcloud secrets create CLOUDINARY_API_SECRET --data-file=-
```
Ketik API secret dari Cloudinary dashboard, tekan **Ctrl+Z** lalu **Enter**.

### Verifikasi Secrets
```cmd
gcloud secrets list
```
Harus ada 6 secrets.

---

## 🚀 Step 5: Deploy

Pastikan kamu di folder project:
```cmd
cd "c:\Project\SwagSuite - LSD"
```

Jalankan command ini (copy semua dalam satu baris):
```cmd
gcloud run deploy swagsuite --source . --region asia-southeast2 --allow-unauthenticated --memory 1Gi --cpu 1 --timeout 300 --min-instances 0 --max-instances 10 --set-secrets DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest,JWT_SECRET=JWT_SECRET:latest,CLOUDINARY_CLOUD_NAME=CLOUDINARY_CLOUD_NAME:latest,CLOUDINARY_API_KEY=CLOUDINARY_API_KEY:latest,CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET:latest
```

Ketik `y` jika ditanya konfirmasi.

⏱️ Tunggu 5-10 menit. Jika berhasil akan muncul URL seperti:
```
Service URL: https://swagsuite-xxxxx-as.a.run.app
```

---

## ✅ Step 6: Verify

Buka URL yang muncul di browser, atau test dengan:
```cmd
curl https://swagsuite-xxxxx-as.a.run.app/api/health
```

Expected response:
```json
{"status":"healthy","timestamp":"...","service":"swagsuite","environment":"production"}
```

---

## 🔄 Update Aplikasi

Setelah ada perubahan code, deploy ulang dengan command yang sama:
```cmd
cd "c:\Project\SwagSuite - LSD"
gcloud run deploy swagsuite --source . --region asia-southeast2 --allow-unauthenticated --memory 1Gi --cpu 1 --timeout 300 --set-secrets DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest,JWT_SECRET=JWT_SECRET:latest,CLOUDINARY_CLOUD_NAME=CLOUDINARY_CLOUD_NAME:latest,CLOUDINARY_API_KEY=CLOUDINARY_API_KEY:latest,CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET:latest
```

---

## 🆘 Troubleshooting

### ❌ "Permission denied on secret"
Jalankan:
```cmd
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
```

### ❌ "Container failed to start"
Cek logs:
```cmd
gcloud run services logs read swagsuite --region asia-southeast2 --limit 50
```

Kemungkinan penyebab:
1. **DATABASE_URL salah** - Pastikan connection string valid dan format benar
2. **Database tidak accessible** - Pastikan database allow connections dari internet
3. **Secret belum dibuat** - Jalankan `gcloud secrets list` untuk verifikasi

### ❌ "Secret already exists"
Hapus secret lama dulu:
```cmd
gcloud secrets delete SECRET_NAME
```
Lalu buat ulang.

### ❌ Build gagal "attached_assets not found"
File sudah dipindah ke `client/public/`. Pastikan code sudah update.

### ❌ "npm ci requires package-lock.json"
Dockerfile sudah diupdate pakai `npm install`. Pastikan file terbaru.

### ❌ "artifactregistry.repositories.uploadArtifacts denied"
Jalankan:
```cmd
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="serviceAccount:YOUR_PROJECT_NUMBER@cloudbuild.gserviceaccount.com" --role="roles/artifactregistry.writer"
```

---

## 📊 Monitoring

### View Logs
```cmd
gcloud run services logs read swagsuite --region asia-southeast2 --limit 100
```

### View Service Details
```cmd
gcloud run services describe swagsuite --region asia-southeast2
```

### Open Console
Buka: https://console.cloud.google.com/run

---

## 💰 Cost Optimization

### Development (Hemat)
```cmd
gcloud run services update swagsuite --region asia-southeast2 --min-instances 0 --max-instances 3 --memory 512Mi
```

### Production
```cmd
gcloud run services update swagsuite --region asia-southeast2 --min-instances 1 --max-instances 10 --memory 1Gi
```

---

## 🗑️ Delete Service

```cmd
gcloud run services delete swagsuite --region asia-southeast2
```

---

## 📝 Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| SESSION_SECRET | Random 32+ char string | `aB3xY9kL2mN7pQ4rS...` |
| JWT_SECRET | Random 32+ char string | `hJ2kM5nP8qR1sT4u...` |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name | `my-cloud` |
| CLOUDINARY_API_KEY | Cloudinary API key | `123456789012345` |
| CLOUDINARY_API_SECRET | Cloudinary API secret | `abcdef123456...` |

---

## ✅ Deployment Checklist

- [ ] Google Cloud SDK installed
- [ ] `gcloud auth login` - logged in
- [ ] Project ID sudah di-set
- [ ] APIs enabled (run, cloudbuild, secretmanager, artifactregistry)
- [ ] Permissions granted (secretAccessor, storage, run.admin, iam.serviceAccountUser)
- [ ] Database PostgreSQL ready & accessible dari internet
- [ ] Cloudinary account created
- [ ] All 6 secrets created dan verified dengan `gcloud secrets list`
- [ ] Deploy command executed
- [ ] Health check passed
