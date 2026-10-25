require("dotenv").config();
const { connectDB, isUsingAtlas, saveFallbackData } = require("./db");
const DailyMetric = require("./models/DailyMetric");
const { generateESGDataset } = require("./utils/dataGenerator");

async function seed() {
  console.log("--- EcoTrack Database Seeding ---");
  if (process.env.NODE_ENV === "production") {
    throw new Error("Dataset seeding is disabled in production.");
  }
  await connectDB();

  console.log("Generating 12-month synthetic ESG dataset for 5 facilities...");
  const records = generateESGDataset();

  if (isUsingAtlas()) {
    console.log("Clearing existing records in MongoDB Atlas...");
    await DailyMetric.deleteMany({});
    console.log(`Inserting ${records.length} records into MongoDB Atlas collection...`);
    await DailyMetric.insertMany(records);
  } else {
    console.log(`Saving ${records.length} records into local embedded JSON store...`);
    saveFallbackData(records);
  }

  const anomalies = records.filter((r) => r.is_anomaly === 1).length;
  console.log("==========================================");
  console.log(`✅ Seeding Complete!`);
  console.log(`Total Records:    ${records.length}`);
  console.log(`Date Range:       ${records[0].date} to ${records[records.length - 1].date}`);
  console.log(`Injected Spikes:  ${anomalies} (~${((anomalies / records.length) * 100).toFixed(1)}%)`);
  console.log("==========================================");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
