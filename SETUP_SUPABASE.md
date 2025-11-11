# 🗄️ Setup Database GRATIS dengan Supabase

## 🎯 Kenapa Supabase?

| Feature               | Supabase FREE    | Railway FREE  | MySQL |
| --------------------- | ---------------- | ------------- | ----- |
| **Database**          | PostgreSQL       | MySQL         | MySQL |
| **Storage**           | 500 MB           | 1 GB          | -     |
| **Bandwidth**         | 5 GB/bulan       | Terbatas      | -     |
| **Auto Backup**       | ✅ Yes           | ❌ No         | -     |
| **Realtime**          | ✅ Built-in      | ❌ No         | -     |
| **Dashboard**         | ✅ Super bagus   | ✅ Bagus      | -     |
| **Time Limit**        | ✅ **UNLIMITED** | 500 jam/bulan | -     |
| **Gratis Selamanya?** | ✅ **YES!**      | Terbatas      | -     |

**💡 Recommendation:** Pakai **Supabase** untuk production! Database lebih stabil & gratis unlimited.

---

## 📋 Step-by-Step Setup Supabase

### **Step 1: Buat Akun Supabase (2 menit)**

1. Buka https://supabase.com
2. Klik **"Start your project"**
3. Sign in dengan **GitHub** (recommended)
4. Gratis, no credit card required! ✅

---

### **Step 2: Buat Project Baru (3 menit)**

1. Di Supabase Dashboard, klik **"New Project"**
2. Isi form:
   - **Name:** `fuelsense-db` (atau nama lain)
   - **Database Password:** Buat password kuat (SIMPAN INI!)
   - **Region:** `Southeast Asia (Singapore)` (terdekat)
   - **Pricing Plan:** Free (sudah terpilih)
3. Klik **"Create new project"**
4. Tunggu 2-3 menit sampai database ready ☕

---

### **Step 3: Ambil Connection String**

1. Di Supabase Dashboard → Project Settings
2. Klik **"Database"** di sidebar
3. Scroll ke **"Connection string"**
4. Pilih tab **"URI"**
5. Copy connection string:

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

6. **PENTING:** Ganti `[YOUR-PASSWORD]` dengan password yang kamu buat tadi!

---

### **Step 4: Update Prisma Schema**

File `backend/prisma/schema.prisma` sudah saya update untuk support PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"  // Changed from mysql
  url      = env("DATABASE_URL")
}
```

---

### **Step 5: Setup Environment Variables**

#### **Local Development:**

Edit `backend/.env`:

```env
# Supabase PostgreSQL Database
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (untuk migrations)
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**💡 Note:**

- `DATABASE_URL` → Port **6543** (connection pooling, untuk app)
- `DIRECT_URL` → Port **5432** (direct connection, untuk migrations)

#### **Vercel Production:**

Tambahkan di Vercel Environment Variables:

- `DATABASE_URL` = (connection string port 6543)
- `DIRECT_URL` = (connection string port 5432)

---

### **Step 6: Run Migration**

```bash
# Install dependencies (jika belum)
cd backend
npm install

# Generate Prisma Client
npx prisma generate

# Run migration (buat tabel)
npx prisma migrate dev --name init

# (Optional) Seed sample data
npm run seed
```

---

### **Step 7: Verify Database**

1. Buka Supabase Dashboard
2. Klik **"Table Editor"** di sidebar
3. Kamu akan lihat tabel `sensor_data` ✅

Atau test dengan Prisma Studio:

```bash
npx prisma studio
# Buka http://localhost:5555
```

---

## 🔧 Troubleshooting

### **Error: "Can't reach database server"**

**Solution:**

- Pastikan `[YOUR-PASSWORD]` sudah diganti dengan password asli
- Pastikan tidak ada karakter spesial yang belum di-encode di password
- Coba reset database password di Supabase Dashboard

### **Error: "SSL connection required"**

**Solution:**
Tambahkan `?sslmode=require` di akhir connection string:

```
postgresql://...postgres?pgbouncer=true&sslmode=require
```

### **Error: "Too many connections"**

**Solution:**

- Gunakan connection pooling (port 6543)
- Supabase Free tier limit: 60 connections
- Port 6543 sudah pakai PgBouncer (connection pooler)

---

## 🚀 Deploy ke Vercel dengan Supabase

1. **Push code** dengan Prisma schema baru
2. **Vercel Dashboard** → Project → Settings → Environment Variables
3. **Tambah 2 variables:**
   - `DATABASE_URL` = (Supabase connection string port 6543)
   - `DIRECT_URL` = (Supabase connection string port 5432)
4. **Redeploy** → Done! ✅

---

## 📊 Monitoring Database

### **Supabase Dashboard Features:**

1. **Table Editor** → Edit data manual
2. **SQL Editor** → Run custom queries
3. **Database** → Lihat metrics (CPU, Memory, Connections)
4. **Logs** → Debug errors
5. **API** → Auto-generated REST API (bonus!)

---

## 🔐 Security Best Practices

1. ✅ **Jangan commit password** di `.env` file
2. ✅ **Enable Row Level Security (RLS)** jika butuh auth
3. ✅ **Gunakan connection pooling** (port 6543)
4. ✅ **Rotate password** secara berkala
5. ✅ **Monitor usage** di Supabase Dashboard

---

## 💰 Supabase Free Tier Limits

| Resource       | Free Tier        | Notes                  |
| -------------- | ---------------- | ---------------------- |
| Database Size  | 500 MB           | Cukup untuk ~500K rows |
| Bandwidth      | 5 GB/bulan       | Cukup untuk API calls  |
| File Storage   | 1 GB             | Bonus feature          |
| Edge Functions | 500K invocations | Bonus feature          |
| Realtime       | 200 concurrent   | Bonus feature          |
| Auth Users     | Unlimited        | Bonus feature          |

**💡 Untuk proyek kamu:** 500 MB cukup untuk jutaan sensor readings!

---

## 🔄 Migration dari MySQL ke PostgreSQL

Jika sudah ada data di Railway MySQL:

```bash
# 1. Export data dari MySQL
# Di Railway dashboard → Database → Connect
# Atau pakai mysqldump

# 2. Convert MySQL dump ke PostgreSQL
# Gunakan tool: https://github.com/lanyrd/mysql-postgresql-converter

# 3. Import ke Supabase
# Pakai Supabase SQL Editor
```

**Atau** jalankan `npm run seed` untuk generate data baru ✅

---

## 🎉 Keuntungan PostgreSQL vs MySQL

| Feature               | PostgreSQL             | MySQL      |
| --------------------- | ---------------------- | ---------- |
| **JSON Support**      | ✅ Native JSON         | ⚠️ Limited |
| **Full-text Search**  | ✅ Built-in            | ❌ Basic   |
| **Arrays**            | ✅ Native              | ❌ No      |
| **Concurrent Writes** | ✅ Better              | ⚠️ Good    |
| **Standards**         | ✅ More compliant      | ⚠️ Less    |
| **Extensions**        | ✅ Many (PostGIS, etc) | ⚠️ Limited |

PostgreSQL = MySQL on steroids! 💪

---

## 📝 Quick Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Deploy migration (production)
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Seed database
npm run seed
```

---

## 🔗 Useful Links

- **Supabase Dashboard:** https://app.supabase.com
- **Supabase Docs:** https://supabase.com/docs
- **Prisma + Supabase Guide:** https://supabase.com/docs/guides/integrations/prisma
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

## ❓ FAQ

**Q: Apakah Supabase benar-benar gratis selamanya?**  
A: ✅ **Ya!** Selama dalam limit free tier (500 MB database, 5 GB bandwidth/bulan)

**Q: Bagaimana jika over limit?**  
A: Supabase akan kasih warning. Kamu bisa upgrade ($25/bulan) atau optimize database.

**Q: Apakah data aman?**  
A: ✅ **Sangat!** Supabase pakai AWS infrastructure, auto backup, SSL encryption.

**Q: Bisa pakai MySQL dan PostgreSQL bersamaan?**  
A: ❌ Tidak recommended. Pilih salah satu. PostgreSQL lebih modern & powerful.

**Q: Migrasi dari Railway MySQL ke Supabase susah?**  
A: ⚠️ Medium difficulty. Tapi bisa pakai seed script untuk generate data baru.

---

**Need help?** Tanya aja! 🚀

**Next:** Jalankan migration dengan command di Step 6! 👆
