import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate realistic sensor reading
 */
function generateSensorReading(baseTime, offsetMinutes) {
  const timestamp = new Date(baseTime.getTime() - offsetMinutes * 60000);
  
  // Simulate realistic engine behavior over time
  const timeOfDay = timestamp.getHours();
  const isHighLoad = timeOfDay >= 7 && timeOfDay <= 9 || timeOfDay >= 17 && timeOfDay <= 19; // Rush hours
  
  // Base values
  const baseRpm = isHighLoad ? 3500 : 2800;
  const baseTorque = isHighLoad ? 220 : 150;
  const baseTemp = isHighLoad ? 95 : 85;
  
  // Add some variation
  const rpmVariation = Math.random() * 800 - 400;
  const torqueVariation = Math.random() * 60 - 30;
  const tempVariation = Math.random() * 15 - 7.5;
  
  const rpm = Math.round(Math.max(800, Math.min(6000, baseRpm + rpmVariation)));
  const torque = Number(Math.max(50, Math.min(350, baseTorque + torqueVariation)).toFixed(1));
  const temperature = Number(Math.max(60, Math.min(115, baseTemp + tempVariation)).toFixed(1));
  
  // MAF correlates with RPM
  const maf = Number((rpm * 0.01 + Math.random() * 10).toFixed(1));
  
  // Fuel consumption correlates with torque and RPM
  const fuelConsumption = Number(((torque * 0.03) + (rpm * 0.001) + Math.random() * 2).toFixed(2));
  
  return {
    timestamp,
    rpm,
    torque,
    maf,
    temperature,
    fuelConsumption,
  };
}

async function main() {
  console.log('🌱 Starting database seed...');
  
  // Clear existing data
  console.log('🗑️  Clearing existing sensor data...');
  await prisma.sensorData.deleteMany({});
  
  const now = new Date();
  const sampleData = [];
  
  // Generate data for the last 7 days
  // More recent data: every 5 minutes for last 24 hours
  console.log('📊 Generating sample data for last 24 hours (every 5 min)...');
  for (let i = 0; i < 288; i++) { // 288 = 24 hours * 12 (5-min intervals)
    sampleData.push(generateSensorReading(now, i * 5));
  }
  
  // Less frequent data: every 30 minutes for days 2-3
  console.log('📊 Generating sample data for days 2-3 (every 30 min)...');
  for (let i = 288; i < 384; i++) { // 96 more readings
    sampleData.push(generateSensorReading(now, i * 5 + (i - 288) * 25));
  }
  
  // Even less frequent: every hour for days 4-7
  console.log('📊 Generating sample data for days 4-7 (every hour)...');
  for (let i = 0; i < 96; i++) { // 96 = 4 days * 24 hours
    const offsetMinutes = 2880 + (i * 60); // Start from 2 days ago
    sampleData.push(generateSensorReading(now, offsetMinutes));
  }
  
  console.log(`📝 Inserting ${sampleData.length} sample records...`);
  
  // Insert in batches to avoid overwhelming the database
  const batchSize = 100;
  for (let i = 0; i < sampleData.length; i += batchSize) {
    const batch = sampleData.slice(i, i + batchSize);
    await prisma.sensorData.createMany({
      data: batch,
    });
    console.log(`   ✓ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sampleData.length / batchSize)}`);
  }
  
  // Get some stats
  const count = await prisma.sensorData.count();
  const latest = await prisma.sensorData.findFirst({
    orderBy: { timestamp: 'desc' },
  });
  const oldest = await prisma.sensorData.findFirst({
    orderBy: { timestamp: 'asc' },
  });
  
  console.log('\n✅ Seed completed successfully!');
  console.log(`📊 Total records: ${count}`);
  console.log(`📅 Date range: ${oldest.timestamp.toISOString()} to ${latest.timestamp.toISOString()}`);
  console.log(`🔧 Latest reading: RPM=${latest.rpm}, Torque=${latest.torque}Nm, Temp=${latest.temperature}°C`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
