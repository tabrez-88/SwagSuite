# SwagSuite - Order Management System

SwagSuite adalah sistem manajemen order untuk industri produk promosi yang dibangun dengan React, Express, dan PostgreSQL.

## 🚀 Deployment

### Google Cloud Run (Production)

Project ini sudah siap untuk di-deploy ke Google Cloud Run. Ikuti panduan berikut:

- **Quick Start (10 menit)**: [QUICKSTART.md](./QUICKSTART.md) - Panduan singkat untuk deployment cepat
- **Deployment Lengkap**: [CLOUD_RUN_DEPLOYMENT.md](./CLOUD_RUN_DEPLOYMENT.md) - Panduan detail lengkap dengan troubleshooting
- **Environment Variables**: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - Daftar lengkap environment variables yang diperlukan

#### Quick Deploy Command

```bash
# Setup secrets interaktif
chmod +x setup-secrets.sh
./setup-secrets.sh

# Deploy ke Cloud Run
chmod +x deploy.sh
./deploy.sh
```

Atau untuk Windows PowerShell:
```powershell
.\deploy.ps1
```

## 🛠️ Technology Stack

- **Frontend**: React, Vite, TailwindCSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Neon/Cloud SQL)
- **ORM**: Drizzle ORM
- **Storage**: Cloudinary (file uploads)
- **Deployment**: Google Cloud Run (containerized)

## 📋 Features

- Order Management
- Client & Company Management
- Supplier & Vendor Management
- Product Catalog
- Artwork Approvals
- Production Stages Tracking
- Email Notifications
- File Upload & Management
- Real-time Dashboard
- And more...

## 🔧 Development

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Cloudinary account (untuk file uploads)

### Local Setup

1. **Clone repository**
```bash
git clone <repository-url>
cd "SwagSuite - LSD"
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env dengan values yang sesuai
```

4. **Setup database**
```bash
# Run migrations
npm run db:migrate

# Seed data (optional)
npm run db:seed
```

5. **Start development server**
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5000`

### Build untuk Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
SwagSuite/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
│   └── public/             # Static assets
├── server/                 # Express backend
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   ├── cloudinary.ts       # File upload handling
│   └── index.ts            # Server entry point
├── migrations/             # Database migrations
├── shared/                 # Shared types and schemas
├── Dockerfile              # Docker configuration
├── cloudbuild.yaml         # Cloud Build CI/CD
└── package.json
```

## 🔐 Environment Variables

Lihat [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) untuk daftar lengkap.

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `JWT_SECRET` - JWT signing key
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### Optional Variables

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration
- `SS_ACTIVEWEAR_ACCOUNT`, `SS_ACTIVEWEAR_API_KEY` - S&S Activewear integration
- `ANTHROPIC_API_KEY` - AI features (optional)

## 🐳 Docker

### Build Image

```bash
docker build -t swagsuite:latest .
```

### Run Container

```bash
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e SESSION_SECRET="your-secret" \
  -e JWT_SECRET="your-jwt-secret" \
  -e CLOUDINARY_CLOUD_NAME="your-cloud" \
  -e CLOUDINARY_API_KEY="your-key" \
  -e CLOUDINARY_API_SECRET="your-secret" \
  swagsuite:latest
```

## 📊 Database

### Migrations

```bash
# Generate new migration
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema (development only)
npm run db:push
```

### Seed Data

```bash
npm run db:seed
```

## 🧪 Testing

```bash
# Type checking
npm run check

# Run tests (jika ada)
npm test
```

## 📝 API Documentation

### Health Check
```
GET /api/health
```

### Authentication
```
GET  /api/auth/user
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Companies
```
GET    /api/companies
GET    /api/companies/:id
POST   /api/companies
PUT    /api/companies/:id
DELETE /api/companies/:id
```

### Orders
```
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PUT    /api/orders/:id
DELETE /api/orders/:id
```

Dan endpoints lainnya... (lihat `server/routes.ts` untuk detail lengkap)

## 🚀 Deployment Options

### 1. Google Cloud Run (Recommended)
- ✅ Auto-scaling
- ✅ Pay-per-use
- ✅ HTTPS out of the box
- ✅ Easy rollback

Lihat [QUICKSTART.md](./QUICKSTART.md) untuk panduan deployment.

### 2. Docker Container
Deploy ke platform apapun yang support Docker:
- Google Kubernetes Engine (GKE)
- AWS ECS/EKS
- Azure Container Instances
- DigitalOcean App Platform
- Fly.io, Railway, Render, dll

### 3. Traditional VPS
Deploy ke VPS dengan Docker atau langsung dengan Node.js:
- Google Compute Engine
- AWS EC2
- DigitalOcean Droplets
- Linode
- Vultr

## 📈 Monitoring

### Cloud Run Metrics (Production)
- Request count, latency, error rate
- CPU & memory usage
- Container instance count
- Logs dengan Cloud Logging

```bash
# View logs
gcloud run services logs read swagsuite --limit 50

# Stream logs
gcloud run services logs tail swagsuite
```

### Local Development
- Console.log output di terminal
- Browser DevTools untuk frontend

## 🔒 Security

- ✅ Session-based authentication
- ✅ Password hashing dengan bcrypt
- ✅ CORS protection
- ✅ SQL injection protection (Drizzle ORM)
- ✅ XSS protection
- ✅ Secrets management (Google Secret Manager)
- ✅ HTTPS enforced (Cloud Run)
- ✅ Non-root container user

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Deployment Issues**: Lihat [CLOUD_RUN_DEPLOYMENT.md](./CLOUD_RUN_DEPLOYMENT.md) bagian Troubleshooting
- **Environment Variables**: Lihat [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- **Quick Questions**: Lihat [QUICKSTART.md](./QUICKSTART.md)

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [Express](https://expressjs.com/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- UI Components from [Shadcn UI](https://ui.shadcn.com/)
- Database ORM by [Drizzle](https://orm.drizzle.team/)
- Hosted on [Google Cloud Run](https://cloud.google.com/run)

---

**Happy Deploying! 🚀**
