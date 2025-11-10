# 🚂 Deployment ke Railway.app

## Kenapa Railway?

✅ **$5 credit gratis per bulan** (cukup untuk development)
✅ **MySQL database gratis**
✅ **Deploy otomatis dari GitHub**
✅ **Setup super mudah (5-10 menit)**
✅ **TIDAK PERLU kartu kredit**
✅ **Free SSL certificate**
✅ **Custom domain support**

---

## 📋 Prasyarat

1. Akun GitHub (sudah punya ✓)
2. Repository GitHub sudah dibuat dan code sudah di-push
3. Akun Railway (gratis, daftar pakai GitHub)

---

## 🚀 Langkah-Langkah Deployment

### Step 1: Daftar Railway (2 menit)

1. Buka https://railway.app
2. Klik **"Login"** atau **"Start a New Project"**
3. Pilih **"Login with GitHub"**
4. Authorize Railway untuk akses GitHub
5. ✅ Selesai! Anda sudah punya akun Railway

### Step 2: Buat Project Baru (1 menit)

1. Di Railway Dashboard, klik **"New Project"**
2. Pilih **"Deploy from GitHub repo"**
3. Pilih repository: **`capstoneWebsite`**
4. Railway akan otomatis detect project Anda

### Step 3: Setup MySQL Database (2 menit)

1. Di project Railway, klik **"+ New"**
2. Pilih **"Database"**
3. Pilih **"Add MySQL"**
4. Railway akan otomatis:
   - ✅ Create MySQL instance
   - ✅ Generate connection URL
   - ✅ Setup environment variables

### Step 4: Configure Environment Variables (3 menit)

1. Klik service **"capstoneWebsite"** (web app)
2. Pilih tab **"Variables"**
3. Klik **"+ New Variable"** dan tambahkan:

#### Required Variables:

| Variable Name  | Value                                | Keterangan                    |
| -------------- | ------------------------------------ | ----------------------------- |
| `NODE_ENV`     | `production`                         | Environment mode              |
| `PORT`         | `3001`                               | Port backend                  |
| `FRONTEND_URL` | `https://<your-app-url>.railway.app` | URL frontend (nanti diupdate) |
| `DATABASE_URL` | _Auto-generated_                     | Otomatis dari MySQL service   |

**Note:** `DATABASE_URL` akan otomatis ter-link saat Anda connect MySQL service ke web app.

#### Cara Connect MySQL ke Web App:

1. Di project view, drag garis dari **MySQL service** ke **Web App service**
2. Railway akan otomatis inject `DATABASE_URL` environment variable
3. ✅ Done!

### Step 5: Update Build Settings (2 menit)

Railway perlu tahu cara build dan run aplikasi Anda.

1. Klik service **"capstoneWebsite"**
2. Pilih tab **"Settings"**
3. Scroll ke **"Build Command"**:

   ```bash
   npm install && cd backend && npm install && npx prisma generate && cd ../frontend && npm install && npm run build && cd .. && npm run build:app-platform
   ```

4. Scroll ke **"Start Command"**:

   ```bash
   cd backend && npx prisma migrate deploy && npm start
   ```

5. Klik **"Save Changes"**

### Step 6: Deploy! (Auto) 🎉

Railway akan otomatis:

1. ✅ Clone repository dari GitHub
2. ✅ Install dependencies
3. ✅ Build frontend
4. ✅ Run Prisma migrations
5. ✅ Start server
6. ✅ Generate public URL

**Deployment URL:** `https://capstonewebsite-production-xxxx.up.railway.app`

---

## 🔄 Auto-Deploy dari GitHub

Setiap kali Anda push code ke GitHub, Railway akan otomatis deploy ulang!

```bash
git add .
git commit -m "Update feature"
git push origin main
# Railway akan otomatis deploy! 🚀
```

---

## 📊 Monitoring

### Logs

1. Di Railway Dashboard, klik service Anda
2. Pilih tab **"Deployments"**
3. Klik deployment terbaru
4. Lihat **"View Logs"** untuk real-time logs

### Metrics

1. Tab **"Metrics"** untuk melihat:
   - CPU usage
   - Memory usage
   - Network traffic

---

## ⚙️ Configuration Files

### 1. Update `package.json` (Root)

Pastikan scripts ini ada:

```json
{
  "scripts": {
    "build:app-platform": "npm run build:frontend && rm -rf backend/public && mkdir -p backend/public && cp -r frontend/dist/* backend/public",
    "start": "cd backend && node src/server.js"
  }
}
```

### 2. Railway Config (Optional)

Buat file `railway.json` di root project:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && npx prisma migrate deploy && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 🌐 Custom Domain (Optional)

1. Di Railway service, pilih tab **"Settings"**
2. Scroll ke **"Domains"**
3. Klik **"Generate Domain"** untuk subdomain Railway
4. Atau klik **"Custom Domain"** untuk domain sendiri

---

## 💰 Pricing & Usage

### Free Tier:

- ✅ **$5 credit/bulan** (gratis)
- ✅ **500 jam execution time**
- ✅ **100 GB network egress**
- ✅ **Shared CPU & 512MB RAM**

### Cukup untuk:

- ✅ Development
- ✅ Testing
- ✅ Portfolio/Demo
- ⚠️ Production kecil (low traffic)

### Monitoring Usage:

1. Dashboard → **"Account Settings"**
2. Lihat **"Usage"**
3. Track:
   - Execution time
   - Network usage
   - Memory usage

---

## 🐛 Troubleshooting

### Build Failed?

**Check logs:**

1. Railway Dashboard → Service → Deployments → View Logs
2. Cari error di build logs

**Common issues:**

```bash
# Prisma generate failed
# Fix: Pastikan DATABASE_URL sudah diset

# Frontend build failed
# Fix: Check frontend build logs, mungkin ada missing dependencies

# Port already in use
# Fix: Railway auto-assign port, pastikan backend listen ke process.env.PORT
```

### Database Connection Error?

**Check:**

1. MySQL service running? (hijau di dashboard)
2. DATABASE_URL ter-inject ke web app?
3. Prisma migrations sudah run?

**Manual migration:**

```bash
# Di Railway service, buka "Deploy Logs"
# Pastikan ada log: "Running Prisma migrations"
```

### App Not Accessible?

**Check:**

1. Deployment status: Success? (hijau)
2. Service running? (tidak sleeping)
3. Domain aktif?
4. Port correct? (Railway auto-set PORT env var)

---

## 📝 Checklist Deployment

- [ ] Railway account created
- [ ] GitHub repo connected
- [ ] MySQL database added
- [ ] MySQL connected to web app
- [ ] Environment variables configured
- [ ] Build command set
- [ ] Start command set
- [ ] Deployment successful
- [ ] App accessible via public URL
- [ ] Database migrations applied
- [ ] Frontend loads correctly
- [ ] Backend API working
- [ ] Real-time features working

---

## 🔐 Security Tips

1. **Never commit `.env` file** (sudah di `.gitignore`)
2. **Use Railway environment variables** untuk secrets
3. **Enable SSL** (otomatis di Railway)
4. **Backup database** regular
5. **Monitor usage** untuk avoid overage charges

---

## 🎯 Next Steps

1. ✅ Deploy aplikasi
2. Test semua fitur
3. Monitor performance
4. Setup custom domain (optional)
5. Configure auto-scaling (jika perlu)

---

## 🆘 Butuh Bantuan?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

---

## 💡 Tips

1. **Free tier cukup** untuk development & demo
2. **Auto-deploy** setiap git push sangat convenient
3. **Logs real-time** memudahkan debugging
4. **MySQL backup** otomatis by Railway
5. **Scale vertical** jika butuh lebih banyak resource

---

## 🎉 Selamat!

Aplikasi EMSys Anda sekarang sudah online dan bisa diakses dari mana saja! 🚀

URL: `https://your-app.up.railway.app`
