require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");
const { router: metricsRouter } = require("./routes/metrics");
const kpiRouter = require("./routes/kpi");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json({ limit: "32kb" }));

// API Routes
app.use("/api/metrics", metricsRouter);
app.use("/api/kpi", kpiRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "EcoTrack MERN API",
    canReseed: process.env.NODE_ENV !== "production",
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "API route not found." });
});

app.use((err, req, res, next) => {
  console.error("Unhandled API error:", err);
  const status = Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({
    success: false,
    error: status === 400 ? "Invalid request body." : "Internal server error.",
  });
});

async function startServer() {
  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  await connectDB();
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log(`🌱 EcoTrack MERN Server listening on port ${PORT}`);
      resolve(server);
    });
    server.once("error", reject);
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error("Failed to start EcoTrack API:", err);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
