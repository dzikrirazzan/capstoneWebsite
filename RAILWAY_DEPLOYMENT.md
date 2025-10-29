# Deployment ke Railway (HTTP Ingest)

Repo sudah menggunakan ingest HTTP (`POST /api/sensor-data`) sehingga tidak bergantung pada WebSocket. Railway tetap menjadi opsi bagus untuk backend long-running atau untuk memisahkan frontend/backed. Dokumen ini merangkum dua pendekatan utama.

## Struktur Monorepo
- Root `package.json` (workspaces `backend/` & `frontend/`).
- Backend Express berada di `backend/src` dengan entry `server.js` (dev lokal) dan `app.js` (export Express instance).
- Frontend Vite berada di `frontend/`.

## Opsi A – Service Terpisah (Disarankan)

### Backend (Express + Prisma)
1. Tambahkan service baru di Railway → pilih Node.
2. Set `Root Directory` ke `backend`.
3. **Build Command**: `npm install && npx prisma generate`.
4. **Start Command**: `npm run start`.
5. Tambahkan database MySQL via plugin Railway lalu salin `DATABASE_URL`.
6. Isi env:
   - `DATABASE_URL`
   - `ALLOWED_ORIGINS` (opsional, mis. `https://frontend-production.up.railway.app`)
7. Setelah deploy pertama, jalankan migrasi:
   ```bash
   railway run npx prisma migrate deploy
   ```

### Frontend (Vite Static)
1. Tambah service lagi → pilih Static Site atau Build Node.
2. Root Directory: `frontend`.
3. Build command: `npm install && npm run build`.
4. Output directory: `dist`.
5. Set env `VITE_BACKEND_URL=https://<backend>.up.railway.app`.
6. Update `FRONTEND_URL` pada service backend agar CORS mengizinkan domain frontend Railway.

## Opsi B – Bundling Single Service
Jika ingin satu domain saja:
1. Gunakan Node service dengan Root Directory repo root.
2. Build command:
   ```bash
   npm install
   npm run build:frontend
   cp -r frontend/dist backend/public
   cd backend
   npx prisma generate
   ```
3. Tambahkan logic serving statis (sudah ada contoh di `backend/src/app.js` jika ingin diaktifkan). Pastikan Express mengarah ke folder `public`.
4. Start command: `cd backend && npm run start`.
5. `FRONTEND_URL` boleh di-set ke domain backend itu sendiri.

> Catatan: bundling berarti setiap update frontend membutuhkan redeploy backend. Opsi ini cocok jika trafik rendah dan ingin konfigurasi sederhana.

## Environment Variables Utama
| Nama | Keterangan |
| ---- | ---------- |
| `DATABASE_URL` | String koneksi MySQL Railway. |
| `FRONTEND_URL` | Digunakan untuk CORS (opsional; bisa kosong → `*`). |
| `ALLOWED_ORIGINS` | Tambahan origin, pisahkan dengan koma. |
| `PORT` | Disediakan otomatis oleh Railway. |
| `VITE_BACKEND_URL` | Disetel di service frontend agar API pointing ke backend. |

## Checklist
- [ ] Database MySQL Railway sudah selesai provisioning dan migrasi sukses (`prisma migrate deploy`).
- [ ] Desktop app diarahkan ke domain backend (`https://<backend>.up.railway.app/api/sensor-data`).
- [ ] Jika menggunakan dua service, backend `FRONTEND_URL` mengizinkan domain frontend.
- [ ] Frontend `VITE_BACKEND_URL` sudah mengarah ke backend produksi.

## FAQ Singkat
- **Apakah polling 5 detik aman di Railway free?** Ya, backend berjalan proses penuh sehingga tidak ada cold start. Pastikan limit plan memadai.
- **Bisakah menggunakan WebSocket lagi?** Bisa, namun perlu menambahkan kembali Socket.IO di backend dan desktop. Untuk Vercel kita nonaktifkan; di Railway Anda bebas menghidupkan kembali bila perlu.
- **Railway CLI perlu?** Tidak wajib, tapi berguna untuk menjalankan migrasi (`railway run ...`) dan mengecek log (`railway logs`).
