# DigitalOcean App Platform Deployment

Panduan ini menyiapkan repo supaya backend Express dan frontend Vite bisa dijalankan sebagai satu atau dua komponen di DigitalOcean App Platform. Kode sudah mendukung serving file statis secara otomatis ketika hasil build frontend tersedia.

## Ringkasan
- Backend (`backend/src/app.js`) akan melayani `/api/*` dan, bila menemukan folder build (`backend/public`, `frontend/dist`, atau nilai `FRONTEND_DIST_PATH`), ikut menyajikan asset frontend.
- Script baru `npm run build:app-platform` menghasilkan `frontend/dist` lalu menyalinnya ke `backend/public`.
- App Platform dapat dijalankan sebagai satu **Web Service** (bundled) atau dua komponen terpisah (Web Service + Static Site).

## Opsi 1 – Bundling Satu Web Service

1. **Create App** → pilih repo → **Web Service**.
2. **Root Directory**: biarkan default (`.`).
3. **Build Command**:
   ```
   npm install
   npm run build:app-platform
   cd backend
   npx prisma generate
   ```
4. **Run Command**:
   ```
   cd backend
   node src/server.js
   ```
5. **Environment Variables** (komponen web service):
   - `NODE_ENV=production`
   - `DATABASE_URL=<connection string MySQL DO>`
   - `FRONTEND_URL=https://<domain-app-platform>`
   - `ALLOWED_ORIGINS` (opsional, comma-separated)
6. Setelah deploy, jalankan migrasi:
   ```bash
   doctl apps run <APP_ID> --component <COMPONENT_NAME> --command "cd backend && npx prisma migrate deploy"
   ```

> Karena backend otomatis menyajikan frontend, domain App Platform langsung menampilkan dashboard.

## Opsi 2 – Service Terpisah

### Backend Web Service
1. Source directory: `backend`.
2. Build command: `npm install && npx prisma generate`.
3. Run command: `npm run start`.
4. Env vars: `DATABASE_URL`, `FRONTEND_URL` (mengarah ke domain frontend), `ALLOWED_ORIGINS` (tambahkan domain frontend).

### Frontend Static Site
1. Source directory: `frontend`.
2. Build command: `npm install && npm run build`.
3. Output directory: `dist`.
4. Env var: `VITE_BACKEND_URL=https://<backend-domain>`.

## Checklist Sebelum Deploy
- [ ] `npm run build:app-platform` berjalan sukses secara lokal (opsi bundling).
- [ ] `DATABASE_URL` menunjuk ke MySQL Managed Database DO (ingat set `DATABASE_URL` juga di lokal sebelum migrasi).
- [ ] Desktop app diarahkan ke `https://<domain-app-platform>/api/sensor-data`.
- [ ] `npx prisma migrate deploy` sudah dijalankan terhadap database produksi.
- [ ] Jika memakai dua service, backend `ALLOWED_ORIGINS` mencakup domain frontend.

## FAQ Singkat
- **Perlu ubah kode lagi?** Tidak, Express otomatis mendeteksi folder build.
- **Bisakah gunakan PostgreSQL?** Ya, tinggal ubah Prisma schema & `DATABASE_URL` sesuai provider.
- **Auto scale?** Atur minimal/maksimal instance di menu Scaling App Platform.
