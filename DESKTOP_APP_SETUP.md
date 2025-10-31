# Panduan Setup Desktop App untuk Mengirim Data ke Website

## Ringkasan

Website FuelSense Monitor sudah siap menerima data dari aplikasi desktop Anda melalui internet menggunakan HTTP REST API. Dokumen ini menjelaskan cara mengirim data sensor dari desktop app ke website.

## URL Endpoint

### Production (Deploy di Internet)

```
https://stingray-app-2envv.ondigitalocean.app/api/sensor-data
```

**Dashboard URL**: https://stingray-app-2envv.ondigitalocean.app

### Development/Testing Lokal

```
http://localhost:3001/api/sensor-data
```

## Format Data yang Harus Dikirim

### Field WAJIB (Required)

Semua field berikut **harus** ada dan berupa angka:

| Field             | Tipe   | Deskripsi            | Contoh |
| ----------------- | ------ | -------------------- | ------ |
| `rpm`             | Number | RPM mesin            | `3500` |
| `torque`          | Number | Torsi mesin (Nm)     | `250`  |
| `maf`             | Number | Mass Air Flow        | `85.5` |
| `temperature`     | Number | Suhu mesin (°C)      | `95.2` |
| `fuelConsumption` | Number | Konsumsi bahan bakar | `8.5`  |

### Contoh Payload JSON

```json
{
  "rpm": 3500,
  "torque": 250,
  "maf": 85.5,
  "temperature": 95.2,
  "fuelConsumption": 8.5,
  "customSensor": 50.0,
  "alertStatus": false,
  "timestamp": "2024-10-31T10:30:00Z"
}
```

## Cara Implementasi

### 1. HTTP POST Request

Kirim data menggunakan HTTP POST dengan header `Content-Type: application/json`

**Method**: `POST`
**URL**: `https://stingray-app-2envv.ondigitalocean.app/api/sensor-data`
**Headers**:

```
Content-Type: application/json
```

### 2. Contoh Kode C# (.NET/WPF)

```csharp
using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

public class FuelSenseApiClient
{
    private readonly HttpClient _client;
    private readonly string _apiUrl;

    public FuelSenseApiClient(string baseUrl)
    {
        _client = new HttpClient();
        _apiUrl = $"{baseUrl.TrimEnd('/')}/api/sensor-data";
    }

    public async Task<bool> SendSensorDataAsync(
        double rpm,
        double torque,
        double maf,
        double temperature,
        double fuelConsumption,
        double? customSensor = null)
    {
        try
        {
            var payload = new
            {
                rpm = rpm,
                torque = torque,
                maf = maf,
                temperature = temperature,
                fuelConsumption = fuelConsumption,
                customSensor = customSensor,
                timestamp = DateTime.UtcNow.ToString("o") // ISO 8601 format
            };

            var response = await _client.PostAsJsonAsync(_apiUrl, payload);

            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine("✅ Data berhasil dikirim");
                return true;
            }
            else
            {
                Console.WriteLine($"❌ Gagal: {response.StatusCode}");
                return false;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error: {ex.Message}");
            return false;
        }
    }

    // Cek koneksi ke server
    public async Task<bool> CheckConnectionAsync()
    {
        try
        {
            var response = await _client.GetAsync($"{_apiUrl.Replace("/api/sensor-data", "")}/api/health");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }
}

// Cara pakai:
var client = new FuelSenseApiClient("https://stingray-app-2envv.ondigitalocean.app");

// Cek koneksi dulu
if (await client.CheckConnectionAsync())
{
    // Kirim data
    await client.SendSensorDataAsync(
        rpm: 3500,
        torque: 250,
        maf: 85.5,
        temperature: 95.2,
        fuelConsumption: 8.5,
        customSensor: 50.0
    );
}
```

### 3. Contoh Kode Python

```python
import requests
from datetime import datetime

def send_sensor_data(rpm, torque, maf, temperature, fuel_consumption, custom_sensor=None):
    url = "https://stingray-app-2envv.ondigitalocean.app/api/sensor-data"

    payload = {
        "rpm": rpm,
        "torque": torque,
        "maf": maf,
        "temperature": temperature,
        "fuelConsumption": fuel_consumption,
        "customSensor": custom_sensor,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)

        if response.status_code == 201:
            print("✅ Data berhasil dikirim")
            return True
        else:
            print(f"❌ Gagal: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

# Cara pakai:
send_sensor_data(
    rpm=3500,
    torque=250,
    maf=85.5,
    temperature=95.2,
    fuel_consumption=8.5,
    custom_sensor=50.0
)
```

### 4. Contoh Kode JavaScript/Node.js

```javascript
async function sendSensorData(data) {
  const url = "https://stingray-app-2envv.ondigitalocean.app/api/sensor-data";

  const payload = {
    rpm: data.rpm,
    torque: data.torque,
    maf: data.maf,
    temperature: data.temperature,
    fuelConsumption: data.fuelConsumption,
    customSensor: data.customSensor || null,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("✅ Data berhasil dikirim");
      return true;
    } else {
      console.log(`❌ Gagal: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

// Cara pakai:
await sendSensorData({
  rpm: 3500,
  torque: 250,
  maf: 85.5,
  temperature: 95.2,
  fuelConsumption: 8.5,
  customSensor: 50.0,
});
```

## Testing & Verifikasi

### 1. Test dengan curl (Command Line)

```bash
# Test health check (cek server hidup)
curl https://stingray-app-2envv.ondigitalocean.app/api/health

# Kirim data test
curl -X POST https://stingray-app-2envv.ondigitalocean.app/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "rpm": 3500,
    "torque": 250,
    "maf": 85.5,
    "temperature": 95.2,
    "fuelConsumption": 8.5,
    "customSensor": 50.0
  }'

# Cek data terbaru
curl https://stingray-app-2envv.ondigitalocean.app/api/sensor-data/latest
```

### 2. Test dengan Postman

1. Buka Postman
2. Buat request baru:
   - **Method**: POST
   - **URL**: `https://stingray-app-2envv.ondigitalocean.app/api/sensor-data`
   - **Headers**:
     - Key: `Content-Type`
     - Value: `application/json`
   - **Body** (pilih raw JSON):
     ```json
     {
       "rpm": 3500,
       "torque": 250,
       "maf": 85.5,
       "temperature": 95.2,
       "fuelConsumption": 8.5
     }
     ```
3. Klik **Send**
4. Response yang berhasil akan mengembalikan status **201 Created** dengan data yang disimpan

### 3. Verifikasi di Dashboard Website

1. Buka website dashboard: `https://stingray-app-2envv.ondigitalocean.app`
2. Data yang baru dikirim akan muncul dalam waktu maksimal 5 detik (otomatis refresh)
3. Cek kartu statistik dan grafik untuk melihat data terbaru

## Response dari Server

### Sukses (201 Created)

```json
{
  "id": 123,
  "timestamp": "2024-10-31T10:30:00.000Z",
  "rpm": 3500,
  "torque": 250,
  "maf": 85.5,
  "temperature": 95.2,
  "fuelConsumption": 8.5,
  "customSensor": 50.0,
  "alertStatus": false
}
```

### Error: Field Tidak Lengkap (400 Bad Request)

```json
{
  "error": "Invalid payload",
  "details": "Missing or invalid fields: rpm, temperature"
}
```

### Error: Server Error (500)

```json
{
  "error": "Failed to save sensor data"
}
```

## Rekomendasi Implementasi

### 1. Frekuensi Pengiriman

- **Recommended**: Kirim data setiap **2-5 detik**
- Jangan terlalu sering (< 1 detik) agar tidak membebani server
- Dashboard akan otomatis refresh setiap 5 detik

### 2. Handling Error

```csharp
// Contoh retry mechanism sederhana
public async Task<bool> SendWithRetryAsync(SensorData data, int maxRetries = 3)
{
    for (int i = 0; i < maxRetries; i++)
    {
        var success = await SendSensorDataAsync(data);
        if (success) return true;

        // Tunggu sebelum retry (backoff)
        await Task.Delay(1000 * (i + 1)); // 1s, 2s, 3s
    }
    return false;
}
```

### 3. Offline Mode

- Simpan data ke buffer/queue lokal jika koneksi internet terputus
- Kirim batch data ketika koneksi kembali
- Gunakan `timestamp` field untuk preserve waktu pembacaan asli

### 4. Setting di Desktop App

Buatlah form setting/konfigurasi untuk:

- **Server URL**: Input field untuk URL production
- **Interval Pengiriman**: Slider/input untuk atur frekuensi (2-10 detik)
- **Status Koneksi**: Indikator visual (hijau = connected, merah = disconnected)
- **Test Connection**: Tombol untuk test koneksi ke server

## Troubleshooting

### ❌ "Connection refused" atau timeout

- **Cek**: Apakah URL sudah benar?
- **Cek**: Apakah ada koneksi internet?
- **Cek**: Test dengan browser buka `https://stingray-app-2envv.ondigitalocean.app/api/health`

### ❌ "400 Bad Request"

- **Penyebab**: Ada field yang kurang atau format salah
- **Solusi**: Pastikan semua field wajib (rpm, torque, maf, temperature, fuelConsumption) ada dan berupa angka

### ❌ "CORS Error" (di browser/JavaScript)

- **Penyebab**: Backend sudah handle CORS dengan benar, tapi jika test di browser pastikan tidak ada mixed content (http vs https)
- **Solusi**: Gunakan HTTPS untuk production

### ❌ Data tidak muncul di dashboard

- **Cek**: Response dari POST apakah 201 (sukses)?
- **Cek**: Tunggu 5-10 detik, dashboard auto-refresh
- **Cek**: Buka browser console di dashboard untuk lihat error
- **Cek**: Test manual: `curl https://stingray-app-2envv.ondigitalocean.app/api/sensor-data/latest`

### ❌ "Certificate Error" / SSL Error

- **Penyebab**: Sertifikat SSL tidak valid (biasanya local development)
- **Solusi Development**: Gunakan `http://localhost:3001` bukan https
- **Solusi Production**: Pastikan domain sudah setup SSL (Vercel/DigitalOcean auto-handle ini)

## Checklist Setup

Pastikan tim desktop app sudah:

- [ ] Install HTTP client library (System.Net.Http untuk C#, requests untuk Python, dll)
- [ ] Dapatkan URL production dari tim backend/devops
- [ ] Implementasi fungsi kirim data dengan 5 field wajib
- [ ] Tambahkan timestamp dalam format ISO 8601
- [ ] Test koneksi dengan health check endpoint
- [ ] Implementasi error handling dan retry mechanism
- [ ] Test kirim data dan verifikasi di dashboard
- [ ] Setup interval pengiriman (recommended 2-5 detik)
- [ ] Tambahkan UI indicator untuk status koneksi
- [ ] Dokumentasi setting URL di user manual

## Endpoint Lainnya (Opsional)

### Health Check

```
GET https://stingray-app-2envv.ondigitalocean.app/api/health
```

Untuk cek apakah server hidup (bisa dipanggil setiap 30 detik untuk monitoring)

### Get Latest Data

```
GET https://stingray-app-2envv.ondigitalocean.app/api/sensor-data/latest
```

Untuk verifikasi data terakhir yang berhasil tersimpan

## Kontak Support

Jika ada masalah atau pertanyaan:

1. Cek dokumentasi lengkap di `README.md` dan `DESKTOP_INTEGRATION.md`
2. Test dulu dengan curl/Postman untuk isolasi masalah
3. Hubungi tim backend dengan informasi error yang detail

---

**Dibuat**: Oktober 2024
**Versi API**: v1.0
**Status**: Production Ready ✅
