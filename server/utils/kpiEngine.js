/**
 * Mathematical KPI & Anomaly Engine for EcoTrack (MERN Stack)
 * Computes:
 * - Summary totals & daily averages
 * - Month-over-Month (MoM) delta percentages
 * - Circular economy Waste Diversion Rate (%)
 * - Carbon emissions intensity
 * - Explainable Gaussian anomaly detection (μ + k*σ per department)
 */

function calculateSummaryKPIs(records) {
  if (!records || records.length === 0) {
    return {
      total_energy_kwh: 0,
      total_water_liters: 0,
      total_waste_kg: 0,
      total_carbon_kg: 0,
      avg_daily_energy_kwh: 0,
      avg_daily_water_liters: 0,
      avg_daily_waste_kg: 0,
      avg_daily_carbon_kg: 0,
      record_count: 0,
      days_count: 0,
    };
  }

  let totalEnergy = 0;
  let totalWater = 0;
  let totalWaste = 0;
  let totalCarbon = 0;
  const uniqueDates = new Set();

  for (const r of records) {
    totalEnergy += r.energy_kwh || 0;
    totalWater += r.water_liters || 0;
    totalWaste += r.waste_total_kg || 0;
    totalCarbon += r.carbon_kg_co2e || 0;
    uniqueDates.add(r.date);
  }

  const daysCount = Math.max(1, uniqueDates.size);

  return {
    total_energy_kwh: Math.round(totalEnergy),
    total_water_liters: Math.round(totalWater),
    total_waste_kg: Math.round(totalWaste),
    total_carbon_kg: Math.round(totalCarbon),
    avg_daily_energy_kwh: Math.round(totalEnergy / daysCount),
    avg_daily_water_liters: Math.round(totalWater / daysCount),
    avg_daily_waste_kg: Math.round(totalWaste / daysCount),
    avg_daily_carbon_kg: Math.round(totalCarbon / daysCount),
    record_count: records.length,
    days_count: daysCount,
  };
}

function calculateMoMMetrics(records) {
  const metrics = ["energy_kwh", "water_liters", "waste_total_kg", "carbon_kg_co2e"];
  const result = {};

  if (!records || records.length < 2) {
    for (const m of metrics) {
      result[m] = { current: 0, previous: 0, delta: 0, pct_change: 0 };
    }
    return result;
  }

  // Sort by date
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const minDate = new Date(sorted[0].date);
  const maxDate = new Date(sorted[sorted.length - 1].date);
  const spanDays = Math.round((maxDate - minDate) / (24 * 60 * 60 * 1000)) + 1;

  let currRecords, prevRecords;
  if (spanDays >= 60) {
    const splitDate = new Date(maxDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const prevStart = new Date(maxDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    currRecords = sorted.filter((r) => r.date > splitDate);
    prevRecords = sorted.filter((r) => r.date <= splitDate && r.date > prevStart);
  } else {
    const midIdx = Math.floor(sorted.length / 2);
    prevRecords = sorted.slice(0, midIdx);
    currRecords = sorted.slice(midIdx);
  }

  for (const m of metrics) {
    const currVal = currRecords.reduce((sum, r) => sum + (r[m] || 0), 0);
    const prevVal = prevRecords.reduce((sum, r) => sum + (r[m] || 0), 0);
    const delta = currVal - prevVal;
    let pctChange = 0;
    if (prevVal > 0) pctChange = (delta / prevVal) * 100;
    else if (currVal > 0) pctChange = 100;

    result[m] = {
      current: Math.round(currVal),
      previous: Math.round(prevVal),
      delta: Math.round(delta),
      pct_change: Math.round(pctChange * 10) / 10,
    };
  }

  return result;
}

function calculateWasteMetrics(records) {
  if (!records || records.length === 0) {
    return { recyclable_kg: 0, non_recyclable_kg: 0, total_waste_kg: 0, diversion_rate_pct: 0 };
  }

  let rec = 0;
  let nonRec = 0;
  for (const r of records) {
    rec += r.waste_recyclable_kg || 0;
    nonRec += r.waste_non_recyclable_kg || 0;
  }
  const total = rec + nonRec;
  const diversionRate = total > 0 ? (rec / total) * 100 : 0;

  return {
    recyclable_kg: Math.round(rec),
    non_recyclable_kg: Math.round(nonRec),
    total_waste_kg: Math.round(total),
    diversion_rate_pct: Math.round(diversionRate * 10) / 10,
  };
}

function calculateDepartmentBreakdown(records) {
  if (!records || records.length === 0) return [];

  const deptMap = {};
  let overallEnergy = 0;
  let overallCarbon = 0;

  for (const r of records) {
    if (!deptMap[r.department]) {
      deptMap[r.department] = {
        department: r.department,
        energy_kwh: 0,
        water_liters: 0,
        waste_total_kg: 0,
        carbon_kg_co2e: 0,
      };
    }
    deptMap[r.department].energy_kwh += r.energy_kwh || 0;
    deptMap[r.department].water_liters += r.water_liters || 0;
    deptMap[r.department].waste_total_kg += r.waste_total_kg || 0;
    deptMap[r.department].carbon_kg_co2e += r.carbon_kg_co2e || 0;

    overallEnergy += r.energy_kwh || 0;
    overallCarbon += r.carbon_kg_co2e || 0;
  }

  return Object.values(deptMap).map((d) => ({
    department: d.department,
    energy_kwh: Math.round(d.energy_kwh),
    water_liters: Math.round(d.water_liters),
    waste_total_kg: Math.round(d.waste_total_kg),
    carbon_kg_co2e: Math.round(d.carbon_kg_co2e),
    energy_share_pct: overallEnergy > 0 ? Math.round((d.energy_kwh / overallEnergy) * 1000) / 10 : 0,
    carbon_share_pct: overallCarbon > 0 ? Math.round((d.carbon_kg_co2e / overallCarbon) * 1000) / 10 : 0,
  }));
}

function detectAnomalies(records, multiplier = 2.0) {
  if (!Number.isFinite(multiplier) || multiplier < 1 || multiplier > 4) {
    throw new RangeError("Anomaly multiplier must be a number between 1 and 4.");
  }
  if (!records || records.length === 0) return [];

  const metrics = [
    { key: "energy_kwh", label: "Energy (kWh)" },
    { key: "water_liters", label: "Water (Liters)" },
    { key: "waste_total_kg", label: "Waste (kg)" },
    { key: "carbon_kg_co2e", label: "Carbon (kg CO2e)" },
  ];

  // Group by department
  const byDept = {};
  for (const r of records) {
    if (!byDept[r.department]) byDept[r.department] = [];
    byDept[r.department].push(r);
  }

  const anomalies = [];

  for (const [dept, deptRecords] of Object.entries(byDept)) {
    if (deptRecords.length < 3) continue;

    for (const m of metrics) {
      const vals = deptRecords.map((r) => r[m.key] || 0);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length - 1);
      const std = Math.sqrt(variance);

      if (!std || std === 0 || isNaN(std)) continue;

      const threshold = mean + multiplier * std;

      for (const r of deptRecords) {
        const val = r[m.key] || 0;
        if (val > threshold) {
          const pctOver = mean > 0 ? ((val - mean) / mean) * 100 : 0;
          anomalies.push({
            date: r.date,
            department: dept,
            metric: m.label,
            value: Math.round(val * 100) / 100,
            department_mean: Math.round(mean * 100) / 100,
            threshold: Math.round(threshold * 100) / 100,
            pct_over_mean: Math.round(pctOver * 10) / 10,
          });
        }
      }
    }
  }

  // Sort descending by date
  return anomalies.sort((a, b) => b.date.localeCompare(a.date));
}

module.exports = {
  calculateSummaryKPIs,
  calculateMoMMetrics,
  calculateWasteMetrics,
  calculateDepartmentBreakdown,
  detectAnomalies,
};
