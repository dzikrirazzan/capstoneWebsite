# Konfigurasi Deployment DigitalOcean App Platform (Bundling Frontend + Backend)

Panduan ini menjelaskan konfigurasi yang perlu disiapkan untuk men-deploy FuelSense Monitor sebagai satu layanan (**frontend + backend**) di DigitalOcean App Platform. Pastikan repo telah disiapkan agar backend Express melayani file statis hasil build Vite.

## Prasyarat Kode
- `backend/src/app.js` perlu ditambahkan konfigurasi statis berikut (opsional jika ingin bundling):
  ```js
  import path from "path";
  import { fileURLToPath } from "url";

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.resolve(__dirname, "../../frontend/dist");

  app.use(express.static(distPath));
  app.get("*", (_, res) => res.sendFile(path.join(distPath, "index.html")));
  ```
- Script root `npm run build` sudah memastikan `frontend/dist` tersedia (mis. `npm run build:frontend`).
- Pastikan backend membaca `process.env.PORT`, `process.env.FRONTEND_URL`, dan `process.env.DATABASE_URL`.

## Langkah Konfigurasi App Platform

### 1. Buat Aplikasi
1. Masuk ke App Platform → `Create App`.
2. Pilih repositori GitHub yang berisi monorepo ini.
3. Saat diminta memilih komponen, pilih **Web Service**.
4. Set **Source Directory** ke root repo (karena build men-trigger backend & frontend sekaligus).

### 2. Build & Run Commands
- **Environment**: Node 20 (atau versi yang sama dengan pengembangan lokal).
- **Build Command**
  ```
  npm install
  npm run build
  cd backend
  npx prisma generate
  ```
  Tambahkan perintah lain jika perlu copy output (mis. `cp -R frontend/dist backend/dist` jika server.js mengharapkan lokasi khusus).
- **Run Command**
  ```
  cd backend
  node src/server.js
  ```
- **HTTP Port**: Biarkan default (App Platform akan mengisi `PORT` env var secara otomatis).

### 3. Konfigurasi Environment Variables
Tambahkan variabel berikut pada komponen Web Service:
- `NODE_ENV=production`
- `DATABASE_URL=<connection string MySQL Managed DO>`
- `FRONTEND_URL=https://<domain-app-platform>`
- Opsional bila frontend perlu API URL:
  - `VITE_BACKEND_URL=https://<domain-app-platform>`

### 4. Database
1. Tambahkan Managed Database MySQL dari DigitalOcean.
2. Di tab **Connections**, copy URI koneksi dan tempel ke `DATABASE_URL`.
3. Jalankan migrasi setelah deploy pertama:
   ```bash
   doctl apps run <APP_ID> --component <COMPONENT_NAME> --command "cd backend && npx prisma migrate deploy"
   ```
   (Atau gunakan tombol “Console” di App Platform dan jalankan perintah yang sama.)

### 5. Auto Deploy & Branch
- Aktifkan “Auto deploy on push” untuk branch produksi (biasanya `main`).
- Pastikan jika menggunakan branch lain, perbarui domain atau var env sesuai.

### 6. Monitoring & Logs
- App Platform menyediakan log stdout/stderr; gunakan untuk memantau request HTTP ingest & Prisma.
- Set alerting (opsional) untuk error jika ingin pemantauan otomatis.

## Checklist Sebelum Deploy
- [ ] Backend sudah menyajikan `frontend/dist` dan route fallback ke `index.html`.
- [ ] Script build menghasilkan `frontend/dist` tanpa error.
- [ ] Semua env var disiapkan (PORT, DATABASE_URL, FRONTEND_URL, VITE_BACKEND_URL).
- [ ] Prisma Schema sudah sinkron dengan database (migrasi siap dijalankan).
- [ ] Desktop app mengirim `POST` ke `https://<domain-app-platform>/api/sensor-data`.

## FAQ Singkat
- **Apakah polling HTTP cocok?** Ya, Web Service App Platform menjaga proses Node aktif sehingga API REST responsif untuk interval 5 detik atau lebih lama.
- **Bisakah scaling otomatis?** Bisa; atur minimum/maximum instance dan ukurannya di tab Scaling.
- **Butuh CDN tambahan?** Tidak wajib; App Platform sudah menyediakan HTTPS + caching dasar, namun bisa tambah Cloudflare jika perlu optimasi lanjutan.
