const express = require("express");
const router = express.Router();
const { getFilteredRecords } = require("./metrics");
const {
  calculateSummaryKPIs,
  calculateMoMMetrics,
  calculateWasteMetrics,
  calculateDepartmentBreakdown,
  detectAnomalies,
} = require("../utils/kpiEngine");
const {
  validateMetricFilters,
  validateMultiplier,
} = require("../utils/requestValidation");

function parseParams(req) {
  const { startDate, endDate, departments } = req.metricFilters;
  return { startDate, endDate, depts: departments };
}

// GET /api/kpi/summary
router.get("/summary", validateMetricFilters, async (req, res) => {
  try {
    const { startDate, endDate, depts } = parseParams(req);
    const records = await getFilteredRecords(startDate, endDate, depts);
    const summary = calculateSummaryKPIs(records);
    const mom = calculateMoMMetrics(records);
    const waste = calculateWasteMetrics(records);
    res.json({ success: true, summary, mom, waste });
  } catch (err) {
    console.error("Failed to calculate KPI summary:", err);
    res.status(500).json({ success: false, error: "Failed to calculate KPI summary." });
  }
});

router.get(
  "/dashboard",
  validateMetricFilters,
  validateMultiplier,
  async (req, res) => {
    try {
      const { startDate, endDate, depts } = parseParams(req);
      const records = await getFilteredRecords(startDate, endDate, depts);
      res.json({
        success: true,
        records,
        summary: calculateSummaryKPIs(records),
        mom: calculateMoMMetrics(records),
        waste: calculateWasteMetrics(records),
        departments: calculateDepartmentBreakdown(records),
        multiplier: req.anomalyMultiplier,
        anomalies: detectAnomalies(records, req.anomalyMultiplier),
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      res.status(500).json({ success: false, error: "Failed to load dashboard data." });
    }
  }
);

// GET /api/kpi/departments - Facility breakdown
router.get("/departments", validateMetricFilters, async (req, res) => {
  try {
    const { startDate, endDate, depts } = parseParams(req);
    const records = await getFilteredRecords(startDate, endDate, depts);
    const breakdown = calculateDepartmentBreakdown(records);
    res.json({ success: true, data: breakdown });
  } catch (err) {
    console.error("Failed to calculate department breakdown:", err);
    res.status(500).json({ success: false, error: "Failed to calculate department breakdown." });
  }
});

// GET /api/kpi/waste - Circular economy metrics
router.get("/waste", validateMetricFilters, async (req, res) => {
  try {
    const { startDate, endDate, depts } = parseParams(req);
    const records = await getFilteredRecords(startDate, endDate, depts);
    const waste = calculateWasteMetrics(records);
    res.json({ success: true, data: waste });
  } catch (err) {
    console.error("Failed to calculate waste metrics:", err);
    res.status(500).json({ success: false, error: "Failed to calculate waste metrics." });
  }
});

// GET /api/kpi/anomalies - Anomaly detection with custom multiplier
router.get("/anomalies", validateMetricFilters, validateMultiplier, async (req, res) => {
  try {
    const { startDate, endDate, depts } = parseParams(req);
    const multiplier = req.anomalyMultiplier;
    const records = await getFilteredRecords(startDate, endDate, depts);
    const anomalies = detectAnomalies(records, multiplier);
    res.json({
      success: true,
      multiplier,
      count: anomalies.length,
      data: anomalies,
    });
  } catch (err) {
    console.error("Failed to detect anomalies:", err);
    res.status(500).json({ success: false, error: "Failed to detect anomalies." });
  }
});

module.exports = router;
