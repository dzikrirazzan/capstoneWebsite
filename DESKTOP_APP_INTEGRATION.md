# 📡 EMSys - Desktop App Integration Guide

Dokumentasi API untuk integrasi Desktop App (.NET) dengan EMSys Web Server.

---

## 🎯 Overview

Desktop app perlu mengirim data sensor engine ke web server melalui HTTP POST request. Data akan otomatis tersimpan di database dan ditampilkan real-time di dashboard web.

**Flow:**

```
Desktop App (Sensor Reading) → HTTP POST → Web Server API → Database → Dashboard
```

---

## 🌐 API Endpoint

### Production URL

```
https://capstone-website-snowy.vercel.app/api/sensor-data
```

## 📝 API Specification

### HTTP Request

- **Method**: `POST`
- **Endpoint**: `/api/sensor-data`
- **Content-Type**: `application/json`

### Request Body Structure

```json
{
  "timestamp": "2025-11-13T10:30:45.000Z",
  "rpm": 3500,
  "torque": 250.5,
  "maf": 45.2,
  "temperature": 85.5,
  "fuelConsumption": 10.25,
  "customSensor": null,
  "alertStatus": false
}
```

---

## 📊 Data Schema

| Field             | Type        | Required        | Unit | Description                            | Contoh                       |
| ----------------- | ----------- | --------------- | ---- | -------------------------------------- | ---------------------------- |
| `timestamp`       | ISO String  | ❌ Optional     | -    | Waktu pembacaan (default: server time) | `"2025-11-13T10:30:45.000Z"` |
| `rpm`             | Number      | ✅ **Required** | RPM  | Putaran mesin per menit                | `3500`                       |
| `torque`          | Number      | ✅ **Required** | Nm   | Torsi mesin                            | `250.5`                      |
| `maf`             | Number      | ✅ **Required** | g/s  | Mass Air Flow                          | `45.2`                       |
| `temperature`     | Number      | ✅ **Required** | °C   | Suhu mesin                             | `85.5`                       |
| `fuelConsumption` | Number      | ✅ **Required** | L/h  | Konsumsi bahan bakar                   | `10.25`                      |
| `customSensor`    | Number/null | ❌ Optional     | -    | Sensor tambahan                        | `null` atau `123.45`         |
| `alertStatus`     | Boolean     | ❌ Optional     | -    | Status alert (auto jika tidak dikirim) | `false`                      |

### ⚠️ Validation Rules

- **Required**: `rpm`, `torque`, `maf`, `temperature`, `fuelConsumption` wajib ada
- **Decimal**: Pakai titik (`.`) bukan koma → `85.5` ✅ bukan `85,5` ❌
- **Timestamp**: Opsional, jika tidak ada server pakai waktu sekarang
- **Alert Status**: Default `true` jika RPM ≥ 5000
- **Null**: Hanya `customSensor` yang boleh `null`

---

## 💻 .NET Implementation

### 1. Model Class

```csharp
public class SensorData
{
    public string timestamp { get; set; }
    public double rpm { get; set; }
    public double torque { get; set; }
    public double maf { get; set; }
    public double temperature { get; set; }
    public double fuelConsumption { get; set; }
    public double? customSensor { get; set; }
    public bool alertStatus { get; set; }
}
```

### 2. HTTP Client Setup

```csharp
using System.Net.Http;
using System.Text;
using System.Text.Json;

private static readonly HttpClient _httpClient = new HttpClient();
private const string API_URL = "https://capstone-website-snowy.vercel.app/api/sensor-data";
```

### 3. Send Function

```csharp
public async Task<bool> SendSensorDataAsync(
    double rpm,
    double torque,
    double maf,
    double temperature,
    double fuelConsumption)
{
    try
    {
        var data = new SensorData
        {
            timestamp = DateTime.UtcNow.ToString("o"), // ISO 8601 format
            rpm = rpm,
            torque = torque,
            maf = maf,
            temperature = temperature,
            fuelConsumption = fuelConsumption,
            customSensor = null,
            alertStatus = rpm >= 5000
        };

        var json = JsonSerializer.Serialize(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync(API_URL, content);

        if (response.IsSuccessStatusCode)
        {
            var result = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"✅ Data sent: {result}");
            return true;
        }
        else
        {
            var error = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"❌ Error {response.StatusCode}: {error}");
            return false;
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Exception: {ex.Message}");
        return false;
    }
}
```

### 4. Usage Example

```csharp
// Kirim data setiap 5 detik
var timer = new System.Timers.Timer(5000); // 5000ms = 5 detik
timer.Elapsed += async (sender, e) =>
{
    // Baca data dari sensor
    double rpm = ReadRpmSensor();
    double torque = ReadTorqueSensor();
    double maf = ReadMafSensor();
    double temperature = ReadTemperatureSensor();
    double fuelConsumption = ReadFuelSensor();

    // Kirim ke server
    await SendSensorDataAsync(rpm, torque, maf, temperature, fuelConsumption);
};
timer.Start();
```

---

## 📡 API Response

### ✅ Success (HTTP 201 Created)

Server akan return data yang baru disimpan:

```json
{
  "id": 481,
  "timestamp": "2025-11-13T10:30:45.000Z",
  "rpm": 3500,
  "torque": 250.5,
  "maf": 45.2,
  "temperature": 85.5,
  "fuelConsumption": 10.25,
  "customSensor": null,
  "alertStatus": false
}
```

### ❌ Error (HTTP 400 Bad Request)

Jika ada field yang missing atau invalid:

```json
{
  "error": "Invalid payload",
  "details": "Missing or invalid fields: rpm, torque"
}
```

### ❌ Error (HTTP 500 Server Error)

Jika ada masalah di server:

```json
{
  "error": "Failed to save sensor data"
}
```

---

## 🔧 Yang Perlu Diimplementasi

### 1. HTTP POST Function ✅

- [ ] Setup `HttpClient`
- [ ] Buat function untuk serialize data ke JSON
- [ ] Set header `Content-Type: application/json`
- [ ] Handle HTTP response (cek status code)

### 2. Data Collection & Formatting ✅

- [ ] Baca data dari sensor engine (RPM, Torque, MAF, Temperature, Fuel)
- [ ] Convert ke tipe data yang benar (double untuk semua number)
- [ ] Optional: Format timestamp ke ISO 8601 (`DateTime.UtcNow.ToString("o")`)

### 3. Sending Strategy ✅ (Pilih salah satu)

**Option A - Interval-Based** ⭐ Recommended

```csharp
// Kirim data setiap 5-10 detik menggunakan Timer
System.Timers.Timer timer = new System.Timers.Timer(5000);
timer.Elapsed += async (s, e) => await SendSensorDataAsync(...);
timer.Start();
```

**Option B - Event-Based**

```csharp
// Kirim hanya saat ada perubahan signifikan
if (Math.Abs(currentRpm - previousRpm) > 100)
{
    await SendSensorDataAsync(...);
}
```

**Option C - Batch**

```csharp
// Kumpulkan data lokal, kirim batch setiap 1 menit
// Berguna jika desktop app kadang offline
```

### 4. Error Handling ✅

- [ ] Try-catch untuk handle exception
- [ ] Retry 2-3x jika gagal (dengan delay 2-3 detik)
- [ ] Log error untuk debugging

### 5. Optional Enhancements 🌟

- [ ] Simpan data lokal jika internet mati (SQLite/file)
- [ ] Retry kirim data yang gagal saat koneksi kembali
- [ ] UI indicator untuk status koneksi (Connected/Error)

---

## 🧪 Testing

### Test dengan Postman

1. **Method**: `POST`
2. **URL**: `https://capstone-website-snowy.vercel.app/api/sensor-data`
3. **Headers**:
   ```
   Content-Type: application/json
   ```
4. **Body** (raw JSON):
   ```json
   {
     "rpm": 3500,
     "torque": 250.5,
     "maf": 45.2,
     "temperature": 85.5,
     "fuelConsumption": 10.25
   }
   ```
5. **Expected**: HTTP 201 Created

### Test dengan cURL

```bash
curl -X POST https://capstone-website-snowy.vercel.app/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"rpm":3500,"torque":250.5,"maf":45.2,"temperature":85.5,"fuelConsumption":10.25}'
```

### Verify di Web Dashboard

Buka: **https://capstone-website-snowy.vercel.app**

Data akan muncul di:

- **Dashboard** → Metrics terbaru + Chart real-time
- **Analisis** → Health Score calculation
- **Riwayat Sensor** → Tabel lengkap semua data

---

## 🔍 Troubleshooting

| Problem               | Cause                        | Solution                                                               |
| --------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| **400 Bad Request**   | Field required tidak lengkap | Pastikan ada: `rpm`, `torque`, `maf`, `temperature`, `fuelConsumption` |
| **500 Server Error**  | Server/database issue        | Retry beberapa kali, hubungi tim web jika persist                      |
| **Network Timeout**   | Internet lambat/mati         | Implement retry atau save data lokal                                   |
| **Data tidak muncul** | Response bukan 201           | Cek HTTP status code, harus `201 Created`                              |
| **Decimal error**     | Pakai koma (,)               | Ganti ke titik (.) → `85.5` bukan `85,5`                               |

---

## 📌 Implementation Checklist

**Minimal (Must Have):**

- [ ] Buat function `SendSensorDataAsync()` dengan HttpClient
- [ ] Serialize sensor data ke JSON format
- [ ] POST ke endpoint dengan header `Content-Type: application/json`
- [ ] Kirim data setiap 5-10 detik (Timer-based)
- [ ] Check HTTP response status (201 = success)
- [ ] Basic error handling (try-catch)

**Optional (Nice to Have):**

- [ ] Retry mechanism (3x retry dengan delay)
- [ ] Error logging untuk debugging
- [ ] Local storage jika offline
- [ ] UI status indicator (Connected/Disconnected)
- [ ] Configuration untuk interval & API URL

---

## 📞 Support

Jika ada pertanyaan:

1. Test dulu dengan Postman/cURL
2. Cek HTTP response status & error message
3. Verify data format sesuai schema
4. Hubungi tim web development

---

**Production API**: `https://capstone-website-snowy.vercel.app/api/sensor-data`  
**Dashboard**: https://capstone-website-snowy.vercel.app  
**Last Updated**: November 13, 2025
