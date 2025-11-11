import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log("🔍 Testing database connection...\n");

    // Test 1: Count records
    const count = await prisma.sensorData.count();
    console.log(`✅ Total records: ${count}`);

    // Test 2: Get latest record
    const latest = await prisma.sensorData.findFirst({
      orderBy: { timestamp: "desc" },
    });
    console.log(`✅ Latest record:`, {
      timestamp: latest.timestamp,
      rpm: latest.rpm,
      torque: latest.torque,
      temperature: latest.temperature,
    });

    // Test 3: Get records from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.sensorData.count({
      where: {
        timestamp: { gte: oneDayAgo },
      },
    });
    console.log(`✅ Records in last 24h: ${recentCount}`);

    console.log("\n🎉 All database tests passed!");
  } catch (error) {
    console.error("❌ Database error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
