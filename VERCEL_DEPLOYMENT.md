# Deployment di Vercel (Free Tier Friendly)

Repo ini sudah disesuaikan supaya frontend (React/Vite) dan backend (Express + Prisma) bisa jalan di Vercel tanpa WebSocket. Data sensor dari desktop app dikirim via HTTP `POST /api/sensor-data`, lalu frontend melakukan polling berkala untuk mendapatkan update terbaru. Dokumen ini merangkum struktur final dan langkah deployment di Vercel Free Tier.

## Arsitektur & File Penting
- **Backend reusable app** – `backend/src/app.js` membangun instance Express dengan CORS dinamis dan route `/api/*`.
- **Server lokal** – `backend/src/server.js` hanya dipakai saat develop lokal (`npm run dev:backend`).
- **Serverless handler** – `api/index.js` membungkus Express menjadi fungsi `serverless-http` untuk environment Vercel.
- **Ingest endpoint** – `backend/src/routes/sensorRoutes.js` sekarang punya `POST /api/sensor-data` yang menulis ke Prisma (tanpa WebSocket).
- **Frontend polling** – `frontend/src/App.jsx` menggunakan `fetch` + interval 5 detik ke `/api/sensor-data/latest`, dan meng-update statistik/histori bila ada record baru.
- **Konfigurasi build** – `vercel.json` menyalin hasil Vite build ke `public/`, mendefinisikan runtime Node 20 untuk `api/index.js`, dan menambahkan fallback route SPA.

## Pipeline Build (vercel.json)
```json
{
  "buildCommand": "npm run build:frontend && rm -rf public && mkdir -p public && cp -r frontend/dist/* public && cd backend && npx prisma generate",
  "functions": {
    "api/index.js": {
      "runtime": "nodejs20.x",
      "maxDuration": 10,
      "memory": 512
    }
  },
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" },
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
```
> Catatan: Vercel otomatis menjalankan `npm install` sebelum `buildCommand`, sehingga perintah instal manual tidak perlu ditambahkan lagi.

## Environment Variables
| Nama | Wajib? | Keterangan |
| ---- | ------ | ---------- |
| `DATABASE_URL` | Ya | Gunakan provider yang menyediakan connection pooling/HTTP Data API (PlanetScale, Neon, Supabase, atau Prisma Accelerate). |
| `FRONTEND_URL` | Opsional | Digunakan backend untuk menyetel CORS (`origin`). Jika kosong akan default ke `*`. |
| `ALLOWED_ORIGINS` | Opsional | Comma-separated origin tambahan (mis. domain desktop app). |
| `VITE_BACKEND_URL` | Disarankan | Set ke `https://<project>.vercel.app` agar frontend memanggil API yang sama saat build. |
| `PRISMA_CLIENT_ENGINE_TYPE` | Opsional | Set `dataproxy` bila memakai Prisma Data Proxy/Accelerate. |

## Database & Migrasi
1. Buat database yang mendukung koneksi bertipe serverless (PlanetScale Data API, Neon, dsb).
2. Isi `DATABASE_URL` di project Vercel.
3. Jalankan migrasi satu kali dari lokal:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
   (Gunakan `DATABASE_URL` yang sama dengan environment production.)

## Langkah Deploy
1. `vercel login`
2. `vercel --prod`
3. Tambahkan environment variables di dashboard Vercel (Production & Preview).
4. Redeploy via dashboard atau jalankan `vercel --prod` ulang setelah env diisi.
5. Pastikan halaman `/history` dapat diakses (routing SPA bekerja karena fallback ke `index.html`).

## Pengiriman Data dari Desktop App
- Ganti komunikasi menjadi HTTP POST:
  ```csharp
  using var client = new HttpClient();
  var payload = new {
      rpm = data.Rpm,
      torque = data.Torque,
      maf = data.Maf,
      temperature = data.Temperature,
      fuelConsumption = data.FuelConsumption,
      customSensor = data.CustomSensor,
      alertStatus = data.AlertStatus,
      timestamp = DateTime.UtcNow
  };

  await client.PostAsJsonAsync($"{backendUrl}/api/sensor-data", payload);
  ```
- Desktop app dapat melakukan ping sederhana `GET /api/health` untuk memeriksa status backend (diterjemahkan di UI sebagai indikator koneksi).

## Checklist Sebelum Go-Live
- [ ] `.env` lokal diperbarui dengan `VITE_BACKEND_URL=http://localhost:5173` atau dikosongkan (proxy Vite masih aktif).
- [ ] Desktop app sudah mengirim data via HTTP POST.
- [ ] `npm run dev` (root) berjalan lancar dan menampilkan data polling.
- [ ] `npm run build:frontend` menghasilkan file di `frontend/dist`.
- [ ] `npx prisma migrate deploy` berhasil dijalankan terhadap database produksi.
- [ ] `vercel --prod` menghasilkan domain `<project>.vercel.app` dan halaman memuat tanpa error.

## Tips Operasional
- Default polling di frontend 5 detik – sesuaikan jika ingin interval lebih rendah/tinggi.
- Vercel Free Tier membatasi 1000 invocations/hari; jika desktop app mengirim data sangat sering, pertimbangkan batching atau upgrade plan.
- Jika membutuhkan notifikasi real-time di masa depan, integrasikan layanan event (Ably, Pusher) tanpa mengubah pipeline HTTP yang sudah ada.
