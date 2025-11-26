import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Generate realistic sensor data
function generateRealisticSensorData(index, baseTime, totalCount) {
  // Simulasi kondisi engine yang lebih realistis untuk kendaraan normal
  const patterns = [
    // Idle/Stop (0-5 menit) - Mesin nyala tapi kendaraan diam
    {
      rpm: () => 700 + Math.random() * 150, // 700-850 RPM
      torque: () => 8 + Math.random() * 7, // 8-15 Nm
      maf: () => 1.5 + Math.random() * 1.5, // 1.5-3 g/s
      temp: () => 75 + Math.random() * 10, // 75-85°C
      fuel: () => 0.4 + Math.random() * 0.4, // 0.4-0.8 L/h
    },
    // Start moving (5-15 menit) - Mulai bergerak, dalam kota
    {
      rpm: () => 1200 + Math.random() * 600, // 1200-1800 RPM
      torque: () => 35 + Math.random() * 25, // 35-60 Nm
      maf: () => 8 + Math.random() * 7, // 8-15 g/s
      temp: () => 80 + Math.random() * 8, // 80-88°C
      fuel: () => 3.5 + Math.random() * 2, // 3.5-5.5 L/h
    },
    // City driving (15-30 menit) - Berkendara normal di kota
    {
      rpm: () => 1800 + Math.random() * 800, // 1800-2600 RPM
      torque: () => 55 + Math.random() * 30, // 55-85 Nm
      maf: () => 12 + Math.random() * 10, // 12-22 g/s
      temp: () => 85 + Math.random() * 8, // 85-93°C
      fuel: () => 5 + Math.random() * 3, // 5-8 L/h
    },
    // Moderate speed (30-45 menit) - Jalan agak lancar
    {
      rpm: () => 2200 + Math.random() * 600, // 2200-2800 RPM
      torque: () => 70 + Math.random() * 30, // 70-100 Nm
      maf: () => 16 + Math.random() * 10, // 16-26 g/s
      temp: () => 88 + Math.random() * 7, // 88-95°C
      fuel: () => 6.5 + Math.random() * 2.5, // 6.5-9 L/h
    },
    // Highway/Cruising (45-60 menit) - Jalan tol atau jalan raya
    {
      rpm: () => 2500 + Math.random() * 500, // 2500-3000 RPM
      torque: () => 85 + Math.random() * 25, // 85-110 Nm
      maf: () => 20 + Math.random() * 8, // 20-28 g/s
      temp: () => 90 + Math.random() * 6, // 90-96°C
      fuel: () => 7.5 + Math.random() * 2, // 7.5-9.5 L/h
    },
    // Acceleration/Overtaking - Akselerasi sesekali
    {
      rpm: () => 3200 + Math.random() * 1000, // 3200-4200 RPM
      torque: () => 110 + Math.random() * 40, // 110-150 Nm
      maf: () => 28 + Math.random() * 15, // 28-43 g/s
      temp: () => 92 + Math.random() * 8, // 92-100°C
      fuel: () => 10 + Math.random() * 4, // 10-14 L/h
    },
    // High speed (occasional) - Kecepatan tinggi sesekali
    {
      rpm: () => 3800 + Math.random() * 800, // 3800-4600 RPM
      torque: () => 130 + Math.random() * 35, // 130-165 Nm
      maf: () => 35 + Math.random() * 12, // 35-47 g/s
      temp: () => 94 + Math.random() * 8, // 94-102°C
      fuel: () => 12 + Math.random() * 4, // 12-16 L/h
    },
    // Deceleration/Coasting - Perlambatan
    {
      rpm: () => 1500 + Math.random() * 500, // 1500-2000 RPM
      torque: () => 25 + Math.random() * 20, // 25-45 Nm
      maf: () => 5 + Math.random() * 8, // 5-13 g/s
      temp: () => 88 + Math.random() * 7, // 88-95°C
      fuel: () => 2.5 + Math.random() * 2, // 2.5-4.5 L/h
    },
  ];

  // Buat pola yang lebih realistis dengan siklus berkendara
  // 10% idle, 15% start, 25% city, 20% moderate, 15% highway, 8% accel, 5% high speed, 2% decel
  const weights = [10, 15, 25, 20, 15, 8, 5, 2];
  const cumulative = weights.reduce((acc, w, i) => {
    acc.push((acc[i - 1] || 0) + w);
    return acc;
  }, []);

  // Pilih pattern berdasarkan posisi dalam dataset dengan variasi acak
  const position = (index / totalCount) * 100;
  const randomFactor = Math.random() * 100;
  const combinedFactor = position * 0.7 + randomFactor * 0.3;

  let patternIndex = 0;
  for (let i = 0; i < cumulative.length; i++) {
    if (combinedFactor <= cumulative[i]) {
      patternIndex = i;
      break;
    }
  }

  const pattern = patterns[patternIndex];

  return {
    rpm: Math.round(pattern.rpm()),
    torque: Math.round(pattern.torque() * 10) / 10,
    maf: Math.round(pattern.maf() * 10) / 10,
    temperature: Math.round(pattern.temp() * 10) / 10,
    fuelConsumption: Math.round(pattern.fuel() * 10) / 10,
    timestamp: new Date(baseTime - (totalCount - 1 - index) * 60000), // Mundur 1 menit per data dari sekarang
  };
}

async function main() {
  const TOTAL_DATA = 573; // Jumlah data yang akan dibuat

  console.log("🗑️  Menghapus semua data yang ada...");

  // Hapus semua data sensor
  const deleteResult = await prisma.sensorData.deleteMany({});
  console.log(`✅ Berhasil menghapus ${deleteResult.count} data lama`);

  console.log(`\n📝 Mengisi database dengan ${TOTAL_DATA} data realistis...`);

  const now = Date.now();
  const sensorDataArray = [];

  // Generate data points
  for (let i = 0; i < TOTAL_DATA; i++) {
    sensorDataArray.push(generateRealisticSensorData(i, now, TOTAL_DATA));
  }

  // Insert data dalam batch untuk performa lebih baik
  console.log("💾 Menyimpan data ke database...");

  let successCount = 0;
  const batchSize = 50;

  for (let i = 0; i < sensorDataArray.length; i += batchSize) {
    const batch = sensorDataArray.slice(i, i + batchSize);
    await prisma.sensorData.createMany({
      data: batch,
    });
    successCount += batch.length;
    console.log(`   Progress: ${successCount}/${TOTAL_DATA} data tersimpan`);
  }

  console.log(`\n✅ Selesai! Database telah direset dan diisi dengan ${TOTAL_DATA} data realistis`);

  // Tampilkan statistik
  const stats = await prisma.sensorData.aggregate({
    _avg: {
      rpm: true,
      torque: true,
      maf: true,
      temperature: true,
      fuelConsumption: true,
    },
    _min: {
      timestamp: true,
    },
    _max: {
      timestamp: true,
    },
    _count: true,
  });

  console.log("\n📊 Statistik Data:");
  console.log(`   Total data: ${stats._count}`);
  console.log(`   Rata-rata RPM: ${Math.round(stats._avg.rpm)}`);
  console.log(`   Rata-rata Torque: ${Math.round(stats._avg.torque * 10) / 10} Nm`);
  console.log(`   Rata-rata MAF: ${Math.round(stats._avg.maf * 10) / 10} g/s`);
  console.log(`   Rata-rata Temperature: ${Math.round(stats._avg.temperature * 10) / 10}°C`);
  console.log(`   Rata-rata Fuel Consumption: ${Math.round(stats._avg.fuelConsumption * 10) / 10} L/h`);
  console.log(`   Rentang waktu: ${stats._min.timestamp.toLocaleString()} - ${stats._max.timestamp.toLocaleString()}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
