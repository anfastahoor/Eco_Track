const express = require("express");
const router = express.Router();
const DailyMetric = require("../models/DailyMetric");
const { isUsingAtlas, getFallbackData, saveFallbackData } = require("../db");
const { generateESGDataset, DEPARTMENTS } = require("../utils/dataGenerator");
const { validateMetricFilters } = require("../utils/requestValidation");

// Helper to query records matching filters
async function getFilteredRecords(startDate, endDate, depts) {
  let records = [];

  if (isUsingAtlas()) {
    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }
    if (depts && depts.length > 0) {
      filter.department = { $in: depts };
    }
    records = await DailyMetric.find(filter).sort({ date: 1, department: 1 }).lean();
  } else {
    records = getFallbackData();
    if (startDate) records = records.filter((r) => r.date >= startDate);
    if (endDate) records = records.filter((r) => r.date <= endDate);
    if (depts && depts.length > 0) {
      const set = new Set(depts);
      records = records.filter((r) => set.has(r.department));
    }
    records.sort((a, b) => a.date.localeCompare(b.date));
  }

  return records;
}

// GET /api/metrics - Filtered metrics
router.get("/", validateMetricFilters, async (req, res) => {
  try {
    const { startDate, endDate, departments } = req.metricFilters;
    const records = await getFilteredRecords(startDate, endDate, departments);
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    console.error("Failed to fetch metrics:", err);
    res.status(500).json({ success: false, error: "Failed to fetch metrics." });
  }
});

// GET /api/metrics/departments - List of departments
router.get("/departments", (req, res) => {
  res.json({ success: true, data: DEPARTMENTS });
});

// GET /api/metrics/bounds - Date range bounds
router.get("/bounds", async (req, res) => {
  try {
    let records = [];
    if (isUsingAtlas()) {
      const first = await DailyMetric.findOne().sort({ date: 1 }).lean();
      const last = await DailyMetric.findOne().sort({ date: -1 }).lean();
      return res.json({
        success: true,
        minDate: first ? first.date : null,
        maxDate: last ? last.date : null,
      });
    } else {
      records = getFallbackData();
      if (records.length === 0) {
        return res.json({ success: true, minDate: null, maxDate: null });
      }
      return res.json({
        success: true,
        minDate: records[0].date,
        maxDate: records[records.length - 1].date,
      });
    }
  } catch (err) {
    console.error("Failed to fetch date bounds:", err);
    res.status(500).json({ success: false, error: "Failed to fetch date bounds." });
  }
});

// POST /api/metrics/seed - Reseed database
router.post("/seed", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      error: "Dataset reseeding is disabled in production.",
    });
  }
  try {
    const records = generateESGDataset();
    if (isUsingAtlas()) {
      await DailyMetric.deleteMany({});
      await DailyMetric.insertMany(records);
    } else {
      saveFallbackData(records);
    }
    res.json({
      success: true,
      message: `Database re-seeded with ${records.length} records.`,
      count: records.length,
    });
  } catch (err) {
    console.error("Failed to reseed metrics:", err);
    res.status(500).json({ success: false, error: "Failed to reseed metrics." });
  }
});

module.exports = {
  router,
  getFilteredRecords,
};
