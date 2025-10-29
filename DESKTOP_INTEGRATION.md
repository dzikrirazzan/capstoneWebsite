# Desktop App Integration Guide

## Overview

Sejak penyesuaian deploy Vercel, backend default menerima data melalui **HTTP REST**. Aplikasi desktop cukup mengirim payload sensor secara periodik menggunakan `POST /api/sensor-data`; frontend melakukan polling 5 detik untuk menampilkan update. Panduan HTTP terbaru ada pada bagian berikut, sedangkan materi WebSocket lama disimpan di bawah sebagai referensi opsional.

## 2024 Update: HTTP REST Ingestion (Default)

### Alur Baru

```
┌─────────────────┐
│ Microcontroller │
│    (ECU Data)   │
└────────┬────────┘
         │ USB/Serial
         ▼
┌─────────────────┐        HTTP POST       ┌──────────────────┐
│  Desktop App    │ ─────────────────────► │  Web Backend     │
│  (C# WPF)       │   /api/sensor-data     │  (Express REST)  │
└─────────────────┘                       └────────┬─────────┘
                                                  Polling
                                                   5s ▼
                                           ┌──────────────────┐
                                           │  Web Dashboard   │
                                           │  (React/Vite)    │
                                           └──────────────────┘
```

### Endpoint yang Tersedia
- `POST /api/sensor-data` – menyimpan satu record sensor. Field minimal: `rpm`, `torque`, `maf`, `temperature`, `fuelConsumption` (angka). Opsional `customSensor`, `alertStatus`, `timestamp`.
- `GET /api/sensor-data/latest` – di-polling frontend/desktop untuk cek koneksi.
- `GET /api/health` – health check sederhana (status indikator UI).

### Contoh Implementasi C# (WPF)
Tambahkan helper service baru (tonjolkan dependency `System.Net.Http.Json`):

```csharp
using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using FuelsenseMonitorApp.Models;

namespace FuelsenseMonitorApp.Services;

public sealed class SensorApiService : IDisposable
{
    private readonly HttpClient _client;

    public SensorApiService(string baseUrl)
    {
        if (string.IsNullOrWhiteSpace(baseUrl))
            throw new ArgumentException("Base URL is required", nameof(baseUrl));

        _client = new HttpClient
        {
            BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/")
        };
        _client.DefaultRequestHeaders.Add("Accept", "application/json");
    }

    public async Task<bool> SendReadingAsync(SensorData data, CancellationToken cancellationToken = default)
    {
        if (data == null) return false;

        var payload = new
        {
            rpm = data.Rpm,
            torque = data.Torque,
            maf = data.Maf,
            temperature = data.Temperature,
            fuelConsumption = data.FuelConsumption,
            customSensor = data.CustomSensor,
            alertStatus = data.AlertStatus,
            timestamp = data.Timestamp?.ToUniversalTime()
        };

        var response = await _client.PostAsJsonAsync("api/sensor-data", payload, cancellationToken);
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> IsBackendReachableAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _client.GetAsync("api/health", cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public void Dispose() => _client.Dispose();
}
```

Kemudian panggil `SendReadingAsync` dari timer existing (500 ms – 5 detik sesuai kebutuhan). Frontend akan otomatis menampilkan data terbaru ketika polling menemukan record baru.

### Konfigurasi Environment Desktop
- Gunakan URL Vercel produksi: `https://<project>.vercel.app`.
- Untuk testing lokal: `http://localhost:5173` (Vite dev server) sudah mem-proxy `/api` ke backend `http://localhost:3001`.

### Mode Offline / Fallback
Jika `SendReadingAsync` gagal (timeout/HTTP error), backend menampilkan data dummy di dashboard untuk menghindari UI kosong. Desktop app tidak perlu mekanisme retry khusus, cukup log error dan coba lagi pada interval berikutnya.

---

## Legacy WebSocket Integration (Opsional)

> Bagian berikut dibiarkan sebagai referensi jika suatu saat ingin menyalakan kembali channel WebSocket (misalnya saat pindah dari Vercel ke host full Node). Secara default **tidak digunakan** pada deployment Vercel sekarang.

### Architecture

```
┌─────────────────┐
│   Microcontroller  │
│    (ECU Data)      │
└────────┬───────────┘
         │ USB/Serial
         ▼
┌─────────────────┐       ┌──────────────────┐
│   Desktop App    │◄──────┤   User Reads     │
│   (C# WPF)       │       │   Via UI         │
└────────┬───────────┘       └──────────────────┘
         │ WebSocket
         │ (WiFi)
         ▼
┌─────────────────┐       ┌──────────────────┐
│   Web Backend    │──────►│  Web Dashboard   │
│   (Express.js)   │       │  (React)         │
└────────────────┘       └──────────────────┘
```

### Step 1: Install Dependencies

### Add SocketIOClient NuGet Package

Open terminal di folder desktop app:

```bash
dotnet add package SocketIOClient --version 3.1.2
```

Atau via Visual Studio:

1. Right-click project → Manage NuGet Packages
2. Search "SocketIOClient"
3. Install

### Step 2: Create WebSocket Service

Buat file baru `Services/WebSocketService.cs`:

```csharp
using SocketIOClient;
using System;
using System.Threading.Tasks;
using FuelsenseMonitorApp.Models;

namespace FuelsenseMonitorApp.Services
{
    public class WebSocketService : IDisposable
    {
        private SocketIO socket;
        private string serverUrl;
        public bool IsConnected => socket?.Connected ?? false;

        public event EventHandler<bool> ConnectionChanged;

        public WebSocketService(string url = "http://localhost:3001")
        {
            serverUrl = url;
        }

        public async Task ConnectAsync()
        {
            try
            {
                socket = new SocketIO(serverUrl, new SocketIOOptions
                {
                    Transport = SocketIOClient.Transport.TransportProtocol.WebSocket,
                    ReconnectionAttempts = 5,
                    ReconnectionDelay = 1000,
                    ConnectionTimeout = TimeSpan.FromSeconds(5)
                });

                socket.OnConnected += (sender, e) =>
                {
                    Console.WriteLine("✅ Connected to web backend");
                    ConnectionChanged?.Invoke(this, true);
                };

                socket.OnDisconnected += (sender, e) =>
                {
                    Console.WriteLine("❌ Disconnected from web backend");
                    ConnectionChanged?.Invoke(this, false);
                };

                socket.OnReconnecting += (sender, e) =>
                {
                    Console.WriteLine("🔄 Reconnecting to web backend...");
                };

                socket.OnError += (sender, e) =>
                {
                    Console.WriteLine($"❌ WebSocket Error: {e}");
                };

                await socket.ConnectAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Failed to connect: {ex.Message}");
                throw;
            }
        }

        public async Task DisconnectAsync()
        {
            if (socket != null && socket.Connected)
            {
                await socket.DisconnectAsync();
            }
        }

        public async Task SendSensorDataAsync(SensorData data)
        {
            if (!IsConnected)
            {
                Console.WriteLine("⚠️ Not connected to server, skipping data send");
                return;
            }

            try
            {
                await socket.EmitAsync("sensor:data", new
                {
                    rpm = data.Rpm,
                    torque = data.Torque,
                    maf = data.Maf,
                    temperature = data.Temperature,
                    fuelConsumption = data.FuelConsumption,
                    customSensor = data.CustomSensor,
                    alertStatus = data.Rpm >= 5000
                });

                Console.WriteLine($"📤 Sent data: RPM={data.Rpm:F1}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Failed to send data: {ex.Message}");
            }
        }

        public void Dispose()
        {
            socket?.DisconnectAsync().Wait();
            socket?.Dispose();
        }
    }
}
```

### Step 3: Modify MainWindow.xaml

Tambahkan connection settings di UI:

```xml
<!-- Add to your existing MainWindow.xaml -->
<StackPanel Margin="10">
    <TextBlock Text="Web Backend Connection" FontSize="16" FontWeight="Bold" Margin="0,0,0,10"/>

    <StackPanel Orientation="Horizontal" Margin="0,0,0,10">
        <TextBlock Text="Server URL:" VerticalAlignment="Center" Width="100"/>
        <TextBox x:Name="txtServerUrl"
                 Text="http://localhost:3001"
                 Width="300"
                 Margin="5,0"/>
        <Button x:Name="btnConnect"
                Content="Connect"
                Click="BtnConnect_Click"
                Width="100"
                Margin="5,0"/>
    </StackPanel>

    <StackPanel Orientation="Horizontal">
        <Ellipse x:Name="connectionIndicator"
                 Width="12"
                 Height="12"
                 Fill="Red"
                 Margin="0,0,10,0"/>
        <TextBlock x:Name="txtConnectionStatus"
                   Text="Disconnected"
                   Foreground="Gray"/>
    </StackPanel>
</StackPanel>
```

### Step 4: Modify MainWindow.xaml.cs

Update code-behind:

```csharp
using FuelsenseMonitorApp.Services;
using System;
using System.Windows;
using System.Windows.Media;
using System.Windows.Threading;

namespace FuelsenseMonitorApp
{
    public partial class MainWindow : Window
    {
        private SerialService serialService;
        private WebSocketService webSocketService;
        private DispatcherTimer dataTimer;

        public MainWindow()
        {
            InitializeComponent();
            InitializeServices();
        }

        private void InitializeServices()
        {
            // Existing serial service
            serialService = new SerialService();

            // New WebSocket service
            webSocketService = new WebSocketService();
            webSocketService.ConnectionChanged += OnWebSocketConnectionChanged;

            // Timer for periodic updates
            dataTimer = new DispatcherTimer();
            dataTimer.Interval = TimeSpan.FromMilliseconds(500); // Send every 500ms
            dataTimer.Tick += DataTimer_Tick;
        }

        private async void BtnConnect_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                btnConnect.IsEnabled = false;
                txtConnectionStatus.Text = "Connecting...";

                var url = txtServerUrl.Text.Trim();
                webSocketService = new WebSocketService(url);
                webSocketService.ConnectionChanged += OnWebSocketConnectionChanged;

                await webSocketService.ConnectAsync();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Connection failed: {ex.Message}", "Error",
                    MessageBoxButton.OK, MessageBoxImage.Error);
                btnConnect.IsEnabled = true;
            }
        }

        private void OnWebSocketConnectionChanged(object sender, bool isConnected)
        {
            Dispatcher.Invoke(() =>
            {
                if (isConnected)
                {
                    connectionIndicator.Fill = new SolidColorBrush(Colors.Green);
                    txtConnectionStatus.Text = "Connected";
                    txtConnectionStatus.Foreground = new SolidColorBrush(Colors.Green);
                    btnConnect.Content = "Disconnect";
                }
                else
                {
                    connectionIndicator.Fill = new SolidColorBrush(Colors.Red);
                    txtConnectionStatus.Text = "Disconnected";
                    txtConnectionStatus.Foreground = new SolidColorBrush(Colors.Gray);
                    btnConnect.Content = "Connect";
                }
                btnConnect.IsEnabled = true;
            });
        }

        private async void DataTimer_Tick(object sender, EventArgs e)
        {
            // Get current sensor data
            var sensorData = GetCurrentSensorData();

            if (sensorData != null && webSocketService.IsConnected)
            {
                await webSocketService.SendSensorDataAsync(sensorData);
            }
        }

        private SensorData GetCurrentSensorData()
        {
            // Implement this based on your existing data structure
            // Example:
            return new SensorData
            {
                Rpm = currentRpm,
                Torque = currentTorque,
                Maf = currentMaf,
                Temperature = currentTemperature,
                FuelConsumption = currentFuelConsumption,
                CustomSensor = customSensorValue
            };
        }

        private void BtnStartMonitoring_Click(object sender, RoutedEventArgs e)
        {
            // Existing start monitoring code...

            // Start sending data to web
            dataTimer.Start();
        }

        private void BtnStopMonitoring_Click(object sender, RoutedEventArgs e)
        {
            // Existing stop monitoring code...

            // Stop sending data to web
            dataTimer.Stop();
        }

        private async void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            dataTimer?.Stop();
            await webSocketService?.DisconnectAsync();
            webSocketService?.Dispose();
            serialService?.Dispose();
        }
    }
}
```

### Step 5: Update SensorData Model (if needed)

Ensure your `Models/SensorData.cs` has all required properties:

```csharp
namespace FuelsenseMonitorApp.Models
{
    public class SensorData
    {
        public double Rpm { get; set; }
        public double Torque { get; set; }
        public double Maf { get; set; }
        public double Temperature { get; set; }
        public double FuelConsumption { get; set; }
        public double CustomSensor { get; set; }
        public bool AlertStatus { get; set; }
    }
}
```

### Step 6: Configuration

### Option 1: Localhost (Development)

```
Server URL: http://localhost:3001
```

### Option 2: Same Network (Production)

1. Find your server's IP address:

   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig | grep inet
   ```

2. Use IP in desktop app:

   ```
   Server URL: http://192.168.1.100:3001
   ```

3. Ensure firewall allows port 3001:
   ```bash
   # Windows Firewall
   netsh advfirewall firewall add rule name="FuelSense Backend" dir=in action=allow protocol=TCP localport=3001
   ```

### Testing

### 1. Start Web Backend

```bash
cd backend
npm run dev
```

### 2. Start Web Frontend

```bash
cd frontend
npm run dev
```

### 3. Run Desktop App

1. Open desktop app
2. Enter server URL (e.g., `http://192.168.1.100:3001`)
3. Click "Connect"
4. Start monitoring
5. Watch data appear in web dashboard

### Troubleshooting

### Connection Refused

- Check backend is running
- Verify firewall settings
- Ensure correct IP and port

### Data Not Appearing

- Check browser console for WebSocket errors
- Verify data format in desktop app console
- Check backend logs

### Slow Performance

- Adjust `dataTimer.Interval` (increase for less frequent updates)
- Default 500ms is good balance

### Advanced: Auto-Reconnect

Add to `SettingsWindow.xaml`:

```xml
<CheckBox x:Name="chkAutoReconnect"
          Content="Auto-reconnect to web backend"
          IsChecked="True"
          Margin="10"/>
```

The SocketIOClient library automatically handles reconnection based on `ReconnectionAttempts` setting.

### Network Deployment

### Desktop App on WiFi → Backend on Server

1. Deploy backend to cloud (Heroku, AWS, DigitalOcean)
2. Update desktop app URL to: `https://your-server.com`
3. Ensure SSL/TLS for secure connection

---

**Questions?** Check the main README.md for more details.
