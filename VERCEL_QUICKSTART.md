# 🚀 QUICK START: Deploy ke Vercel

## ✅ Setup Selesai!

File-file berikut sudah dibuat dan di-push ke GitHub:

- ✅ `vercel.json` - Konfigurasi Vercel
- ✅ `.vercelignore` - File yang di-exclude dari deployment
- ✅ `DEPLOYMENT_VERCEL.md` - Dokumentasi lengkap

---

## 🎯 Langkah Deploy (5 Menit)

### **1. Buka Vercel**

```
https://vercel.com/new
```

### **2. Import Repository**

- Login dengan GitHub
- Pilih repository: **dzikrirazzan/capstoneWebsite**
- Klik **Import**

### **3. Configure Project**

Vercel akan auto-detect settings. Pastikan:

- ✅ Framework: **Vite**
- ✅ Build Command: `npm run build:frontend`
- ✅ Output Directory: `frontend/dist`
- ✅ Root Directory: `./`

### **4. Tambah Environment Variable**

Klik **"Environment Variables"**, tambahkan:

**Variable Name:** `DATABASE_URL`  
**Value:** Copy dari Railway dashboard kamu

```
mysql://root:xxx@xxx.railway.app:3306/railway
```

### **5. Deploy!**

Klik tombol **Deploy** 🚀

---

## 🗄️ Cara Dapat DATABASE_URL dari Railway

1. Buka https://railway.app/dashboard
2. Klik project database kamu
3. Tab **"Variables"**
4. Copy value dari `DATABASE_URL`

---

## 🎉 Setelah Deploy

Vercel akan kasih URL seperti:

```
https://capstonewebsite-xxx.vercel.app
```

**Auto Deploy Enabled:**

- Setiap `git push` → auto deploy baru ✅
- PR baru → preview deployment ✅

---

## 🔧 Troubleshooting

**Error: Cannot connect to database**
→ Pastikan `DATABASE_URL` di Vercel sama dengan Railway

**Error: Prisma client not generated**
→ Tunggu 2-3 menit, Vercel sedang generate

**Error: 404 on API routes**
→ Clear cache dan redeploy

---

## 📝 Perbedaan Vercel vs Railway

**Railway (saat ini):**

- Frontend + Backend dalam 1 server
- Database included
- 500 jam free/bulan

**Vercel (baru):**

- Frontend + Backend serverless
- Database tetap di Railway
- Unlimited (dalam limit bandwidth)
- Lebih cepat & scalable

**Rekomendasi:**
✅ Deploy ke Vercel untuk production
✅ Railway tetap untuk database

---

**Need help?** Lihat `DEPLOYMENT_VERCEL.md` untuk detail lengkap! 🚀
