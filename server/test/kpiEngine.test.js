const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateSummaryKPIs,
  calculateWasteMetrics,
  detectAnomalies,
} = require("../utils/kpiEngine");

test("returns zeroed KPI summaries for empty data", () => {
  assert.equal(calculateSummaryKPIs([]).record_count, 0);
  assert.equal(calculateWasteMetrics([]).diversion_rate_pct, 0);
});

test("calculates waste diversion based on recyclable and total waste", () => {
  const result = calculateWasteMetrics([
    { waste_recyclable_kg: 30, waste_non_recyclable_kg: 70 },
  ]);
  assert.equal(result.total_waste_kg, 100);
  assert.equal(result.diversion_rate_pct, 30);
});

test("rejects anomaly multipliers outside the supported range", () => {
  assert.throws(() => detectAnomalies([], 0), RangeError);
  assert.throws(() => detectAnomalies([], Number.NaN), RangeError);
});
