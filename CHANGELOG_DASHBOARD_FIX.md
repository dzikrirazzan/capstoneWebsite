# Changelog - Dashboard Data Fix & Custom Date Picker

## Tanggal: 13 November 2025

### 🐛 Bug Fixes

#### 1. **Dashboard Tidak Menampilkan Data Lama**

**Masalah:**

- Dashboard kosong saat dibuka meskipun ada data dari kemarin
- Data hanya muncul di halaman Riwayat Sensor
- Toggle range (1h, 24h, 7d, 30d) tidak menampilkan data

**Penyebab:**

- Default `statsRange` adalah `"1h"` yang hanya mengambil data 1 jam terakhir
- Jika data terakhir masuk kemarin, maka tidak ada data dalam rentang 1 jam terakhir
- Logic fetching data menggunakan filter yang terlalu ketat

**Solusi:**

- ✅ Ubah default `statsRange` dari `"1h"` menjadi `"all"` untuk menampilkan semua data saat pertama kali buka
- ✅ Tambahkan opsi "Semua Data" di range selector
- ✅ Perbaiki logic `fetchChartData` dan `fetchStats` untuk menangani range "all" (tanpa filter tanggal)
- ✅ Tampilkan pesan yang lebih informatif saat data kosong dengan tombol "Lihat Semua Data"

### ✨ New Features

#### 2. **Custom Date Picker di Dashboard**

**Fitur Baru:**

- ✅ Tombol "Custom" di dashboard untuk memilih tanggal secara manual
- ✅ Date picker dengan input tanggal mulai dan tanggal akhir
- ✅ Tombol "Terapkan" untuk apply filter custom
- ✅ Tombol "Reset" untuk clear custom date dan kembali ke "Semua Data"
- ✅ Informasi rentang tanggal yang dipilih ditampilkan di bawah date picker

**Cara Penggunaan:**

1. Klik tombol "Custom" di bagian filter range
2. Pilih tanggal mulai dan/atau tanggal akhir
3. Klik "Terapkan"
4. Chart dan statistik akan update sesuai rentang yang dipilih
5. Klik "Reset" untuk clear filter

### 🔧 Technical Changes

#### File yang Diubah:

**1. `frontend/src/App.jsx`**

- Tambah state `customStartDate` dan `customEndDate`
- Ubah default `statsRange` dari `"1h"` ke `"all"`
- Refactor `fetchStats()` untuk handle custom date dan range "all"
- Refactor `fetchChartData()` untuk handle custom date dan range "all"
- Tambah `handleCustomDateChange()` untuk update custom date
- Update `handleStatsRangeChange()` untuk clear custom date saat pilih predefined range
- Update polling logic agar tidak refresh data saat menggunakan custom date
- Pass props baru ke component Dashboard

**2. `frontend/src/components/SensorChart.jsx`**

- Import `Calendar` icon dari lucide-react
- Tambah range option "Semua Data" dengan value `"all"`
- Tambah state `showCustomDate` untuk toggle date picker
- Tambah props `customStartDate`, `customEndDate`, `onCustomDateChange`
- Tambah tombol "Custom" di range selector
- Tambah UI date picker dengan 2 input (start & end date)
- Tambah handler `handleCustomDateApply()` dan `handleCustomDateClear()`
- Perbaiki empty state message dengan kondisi berdasarkan `activeRange`
- Tambah tombol "Lihat Semua Data" di empty state

**3. `frontend/src/components/Dashboard.jsx`**

- Tambah props `onCustomDateChange`, `customStartDate`, `customEndDate`
- Pass props baru ke SensorChart component

### 📊 API Changes

**Endpoint Behavior:**

**`GET /api/sensor-data/stats`**

- Tanpa params = return stats untuk semua data
- `?range=1h` = data 1 jam terakhir
- `?range=24h` = data 24 jam terakhir
- `?range=7d` = data 7 hari terakhir
- `?range=30d` = data 30 hari terakhir
- `?start=...&end=...` = custom range

**`GET /api/sensor-data/series`**

- Tanpa params = return semua data (dengan limit 1000)
- `?start=...&end=...` = data dalam rentang tertentu
- `?limit=X` = max records to return

### 🎨 UI/UX Improvements

**Before:**

```
[ 1 Jam ] [ 24 Jam ] [ 7 Hari ] [ 30 Hari ]
```

**After:**

```
[ 1 Jam ] [ 24 Jam ] [ 7 Hari ] [ 30 Hari ] [ Semua Data ] [ 📅 Custom ]

(Jika Custom diklik, muncul date picker:)
┌─────────────────────────────────────────────────┐
│ 📅 Pilih Rentang Tanggal Custom                 │
├─────────────────────────────────────────────────┤
│ Tanggal Mulai: [2025-11-01▼]                   │
│ Tanggal Akhir: [2025-11-13▼]                   │
│                      [ Terapkan ] [ Reset ]     │
│ Data dari 2025-11-01 sampai 2025-11-13         │
└─────────────────────────────────────────────────┘
```

**Empty State (Improved):**

```
        🔔
    Tidak ada data

Tidak ada data untuk rentang waktu yang dipilih

      [ Lihat Semua Data ]
```

### ✅ Testing Checklist

- [x] Dashboard menampilkan data saat pertama kali dibuka (default: Semua Data)
- [x] Toggle "1 Jam" menampilkan data 1 jam terakhir (jika ada)
- [x] Toggle "24 Jam" menampilkan data 24 jam terakhir
- [x] Toggle "7 Hari" menampilkan data 7 hari terakhir
- [x] Toggle "30 Hari" menampilkan data 30 hari terakhir
- [x] Toggle "Semua Data" menampilkan semua data
- [x] Tombol "Custom" membuka date picker
- [x] Date picker bisa pilih tanggal mulai
- [x] Date picker bisa pilih tanggal akhir
- [x] Date picker bisa pilih hanya start date (end = sekarang)
- [x] Date picker bisa pilih hanya end date (start = earliest)
- [x] Tombol "Terapkan" apply filter custom date
- [x] Tombol "Reset" clear custom date dan kembali ke "Semua Data"
- [x] Chart update sesuai filter yang dipilih
- [x] Stats panel update sesuai filter yang dipilih
- [x] Empty state menampilkan pesan yang sesuai
- [x] Tombol "Lihat Semua Data" di empty state berfungsi
- [x] Real-time polling tidak mengubah custom date filter
- [x] Perpindahan antar predefined range clear custom date

### 🚀 Deployment Notes

1. **Build frontend:**

   ```bash
   cd frontend
   npm run build
   ```

2. **Test locally:**

   ```bash
   npm run dev
   ```

3. **Verify:**
   - Buka http://localhost:5173
   - Dashboard harus menampilkan data (jika ada)
   - Test semua range options
   - Test custom date picker

### 📝 Notes

- Data lama sekarang akan terlihat dengan pilih "Semua Data" atau custom date range
- Real-time data tetap berjalan normal, hanya tidak auto-refresh saat pakai custom date
- Filter di Dashboard (chart) terpisah dari filter di Riwayat Sensor
- Custom date menggunakan local timezone, converted ke UTC saat kirim ke API

### 🔍 Known Issues / Limitations

- Custom date picker menggunakan HTML5 `<input type="date">` yang tampilannya berbeda per browser
- Timezone handling menggunakan local browser timezone
- Untuk mobile, keyboard date picker mungkin kurang optimal (bisa improve dengan library seperti react-datepicker)

---

**Dibuat oleh:** Dzikri Razzan  
**Status:** ✅ Ready for Testing
