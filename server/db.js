const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const FALLBACK_FILE = path.join(DATA_DIR, "ecotrack.json");

let isUsingAtlas = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim().startsWith("mongodb")) {
    try {
      console.log("Connecting to MongoDB Atlas / Remote Cluster...");
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      isUsingAtlas = true;
      console.log("✅ Successfully connected to MongoDB Atlas!");
      return true;
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Could not connect to MongoDB in production.", { cause: err });
      }
      console.warn("⚠️ Could not connect to MONGODB_URI (" + err.message + ").");
      console.log("Falling back to local high-performance JSON persistence store.");
    }
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MONGODB_URI is required in production.");
    }
    console.log("ℹ️ No MONGODB_URI provided in .env.");
    console.log("🚀 Using local embedded MongoDB-compatible store (zero external dependencies).");
  }

  isUsingAtlas = false;
  return false;
}

// Fallback persistence helper for local mock Mongoose queries
function getFallbackData() {
  if (!fs.existsSync(FALLBACK_FILE)) {
    return [];
  }
  const raw = fs.readFileSync(FALLBACK_FILE, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error("Local metrics data must be a JSON array.");
  }
  return data;
}

function saveFallbackData(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temporaryFile = `${FALLBACK_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(data), "utf8");
  fs.renameSync(temporaryFile, FALLBACK_FILE);
}

module.exports = {
  connectDB,
  isUsingAtlas: () => isUsingAtlas,
  getFallbackData,
  saveFallbackData,
};
