# 🚀 Deploy FuelSense ke Vercel (GRATIS)

## ✅ Status: SIAP DEPLOY

Proyek ini sudah dikonfigurasi untuk deploy ke Vercel dengan fitur:
- ✅ Frontend React + Vite
- ✅ Backend Express.js (Serverless Functions)
- ✅ MySQL Database (eksternal)
- ✅ API Routes sudah setup

---

## 📋 Prerequisites

1. **Akun Vercel** (gratis): https://vercel.com/signup
2. **Database MySQL** yang accessible dari internet:
   - Railway MySQL (kamu sudah punya ✅)
   - Atau PlanetScale (MySQL-compatible, free tier bagus)
   - Atau Supabase PostgreSQL (bisa switch dari MySQL)

---

## 🎯 Langkah-Langkah Deploy

### **Step 1: Setup Database di Railway (SUDAH ADA)**

Kamu sudah punya Railway MySQL, pastikan:
- Database sudah running
- `DATABASE_URL` sudah ada

Cek Railway dashboard untuk `DATABASE_URL`:
```
mysql://user:password@host:port/database
```

---

### **Step 2: Push Code ke GitHub**

```bash
# Commit semua perubahan
git add .
git commit -m "Setup Vercel deployment configuration"
git push origin main
```

---

### **Step 3: Deploy ke Vercel**

**Opsi A: Via Vercel Dashboard (RECOMMENDED)**

1. Buka https://vercel.com/new
2. Login dengan GitHub
3. Pilih repository: **dzikrirazzan/capstoneWebsite**
4. Klik **Import**

**Configure Project:**
- Framework Preset: **Vite**
- Root Directory: `./` (leave as is)
- Build Command: `npm run build:frontend`
- Output Directory: `frontend/dist`

5. Klik **"Environment Variables"** dan tambahkan:

```env
DATABASE_URL=mysql://user:password@host:port/database
NODE_ENV=production
```

> 💡 Copy `DATABASE_URL` dari Railway dashboard kamu

6. Klik **Deploy** 🚀

**Opsi B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - What's your project's name? capstonewebsite
# - In which directory is your code located? ./
# - Want to modify settings? Yes
#   - Build Command: npm run build:frontend
#   - Output Directory: frontend/dist
#   - Development Command: npm run dev

# Add environment variables
vercel env add DATABASE_URL
# Paste your Railway DATABASE_URL

# Deploy to production
vercel --prod
```

---

### **Step 4: Setup Prisma di Vercel**

Setelah deploy pertama, perlu setup Prisma:

1. Di Vercel Dashboard → Project Settings → Environment Variables
2. Pastikan `DATABASE_URL` sudah ada
3. Redeploy (Vercel akan auto-generate Prisma client)

---

### **Step 5: Migrate Database (First Time Only)**

Jika database masih kosong, jalankan migration dari local:

```bash
# Set DATABASE_URL ke Railway
export DATABASE_URL="mysql://user:password@host:port/database"

# Run migration
cd backend
npx prisma migrate deploy

# (Optional) Seed data
npm run seed
```

---

## 🔧 Konfigurasi File yang Sudah Dibuat

### **vercel.json**
```json
{
  "version": 2,
  "buildCommand": "npm run build:frontend",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "functions": {
    "api/*.js": {
      "runtime": "nodejs20.x",
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### **.vercelignore**
File untuk exclude dari deployment (optimize size)

---

## 🌐 Setelah Deploy

Vercel akan memberikan URL seperti:
```
https://capstonewebsite.vercel.app
```

**Auto Deploy:**
- Setiap push ke `main` branch → auto deploy
- Pull Request → preview deployment

---

## 🐛 Troubleshooting

### **Problem: API tidak jalan**
**Solution:**
- Cek Environment Variables di Vercel Dashboard
- Pastikan `DATABASE_URL` benar
- Cek Vercel Function Logs di Dashboard

### **Problem: Database connection error**
**Solution:**
- Pastikan Railway database accessible dari public
- Check Railway database status
- Verify `DATABASE_URL` format benar

### **Problem: Build failed**
**Solution:**
- Cek Vercel build logs
- Pastikan `npm run build:frontend` jalan di local
- Cek `package.json` dependencies

### **Problem: Prisma error "Can't reach database"**
**Solution:**
```bash
# Generate Prisma Client dulu
cd backend
npx prisma generate
git add .
git commit -m "Generate Prisma client"
git push
```

---

## 💰 Cost Comparison: Vercel vs Railway

| Feature | Vercel Free | Railway Free |
|---------|-------------|--------------|
| Hosting | ✅ Unlimited | ✅ 500 jam/bulan |
| Bandwidth | 100 GB/bulan | Terbatas |
| Build Time | 100 jam/bulan | - |
| Serverless Functions | ✅ Yes | - |
| Database | ❌ No (perlu eksternal) | ✅ MySQL included |
| Auto Deploy | ✅ Yes | ✅ Yes |
| Custom Domain | ✅ Yes | ✅ Yes |

**💡 Recommendation:**
- **Frontend + Backend API**: Deploy ke **Vercel** ✅
- **Database**: Tetap di **Railway** ✅
- Best of both worlds! 🎉

---

## 📊 Next Steps After Deploy

1. ✅ Test semua endpoint API
2. ✅ Test frontend functionality
3. ✅ Setup custom domain (optional)
4. ✅ Monitor Vercel Analytics
5. ✅ Setup error tracking (optional: Sentry)

---

## 🔗 Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs: https://vercel.com/docs
- Railway Dashboard: https://railway.app/dashboard
- Your GitHub Repo: https://github.com/dzikrirazzan/capstoneWebsite

---

**Butuh bantuan?** Tanya aja! 🚀
