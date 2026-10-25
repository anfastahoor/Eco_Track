/**
 * Synthetic ESG data generation engine for EcoTrack (Node.js/Express)
 * Simulates 12 months of multi-facility daily records with seasonal variation and anomalies.
 */

// Grid-average greenhouse gas emission factor for electricity: 0.71 kg CO2e / kWh
const GRID_EMISSION_FACTOR_KG_PER_KWH = 0.71;

const DEPARTMENTS = [
  "HQ Operations",
  "R&D Lab",
  "Manufacturing Facility",
  "Data Center",
  "Logistics Hub",
];

const DEPT_PROFILES = {
  "HQ Operations": {
    energy_base: 1800,
    energy_noise: 150,
    water_base: 4200,
    water_noise: 400,
    waste_rec_base: 120,
    waste_non_rec_base: 60,
    weekend_mult: 0.35,
  },
  "R&D Lab": {
    energy_base: 2800,
    energy_noise: 300,
    water_base: 2600,
    water_noise: 250,
    waste_rec_base: 90,
    waste_non_rec_base: 110,
    weekend_mult: 0.45,
  },
  "Manufacturing Facility": {
    energy_base: 6500,
    energy_noise: 500,
    water_base: 8500,
    water_noise: 700,
    waste_rec_base: 450,
    waste_non_rec_base: 320,
    weekend_mult: 0.75,
  },
  "Data Center": {
    energy_base: 9200,
    energy_noise: 350,
    water_base: 5100,
    water_noise: 300,
    waste_rec_base: 40,
    waste_non_rec_base: 30,
    weekend_mult: 0.98,
  },
  "Logistics Hub": {
    energy_base: 3100,
    energy_noise: 250,
    water_base: 2100,
    water_noise: 200,
    waste_rec_base: 240,
    waste_non_rec_base: 150,
    weekend_mult: 0.55,
  },
};

// Box-Muller Gaussian random generator
function gaussianRandom(mean = 0, stdev = 1) {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

function getDayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start + (start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getSeasonalFactor(d) {
  const dayOfYear = getDayOfYear(d);
  // Summer HVAC peak around day 200, winter peak around day 15
  const summerPeak = Math.exp(-Math.pow(dayOfYear - 200, 2) / (2 * Math.pow(40, 2))) * 0.25;
  const winterPeak = Math.exp(-Math.pow(dayOfYear - 15, 2) / (2 * Math.pow(30, 2))) * 0.12;
  return 1.0 + summerPeak + winterPeak;
}

function generateESGDataset(startDateStr = null, endDateStr = null, anomalyRate = 0.03) {
  const today = new Date();
  const endDate = endDateStr ? new Date(endDateStr) : new Date(today);
  const startDate = startDateStr
    ? new Date(startDateStr)
    : new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);

  const records = [];
  const oneDayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.round((endDate - startDate) / oneDayMs) + 1;

  for (let i = 0; i < totalDays; i++) {
    const curr = new Date(startDate.getTime() + i * oneDayMs);
    const dateStr = curr.toISOString().split("T")[0];
    const isWeekend = curr.getDay() === 0 || curr.getDay() === 6;
    const seasonalMult = getSeasonalFactor(curr);

    for (const dept of DEPARTMENTS) {
      const profile = DEPT_PROFILES[dept];
      const dowMult = isWeekend ? profile.weekend_mult : 1.0;

      let energy = Math.max(
        10,
        (profile.energy_base + gaussianRandom(0, profile.energy_noise)) * dowMult * seasonalMult
      );

      const waterSeasonal = 1.0 + 0.15 * (seasonalMult - 1.0);
      let water = Math.max(
        10,
        (profile.water_base + gaussianRandom(0, profile.water_noise)) * dowMult * waterSeasonal
      );

      let wasteRec = Math.max(
        1,
        (profile.waste_rec_base + gaussianRandom(0, profile.waste_rec_base * 0.12)) * dowMult
      );

      let wasteNonRec = Math.max(
        1,
        (profile.waste_non_rec_base + gaussianRandom(0, profile.waste_non_rec_base * 0.12)) * dowMult
      );

      let isAnomaly = 0;
      if (Math.random() < anomalyRate) {
        isAnomaly = 1;
        const types = ["energy_surge", "water_leak", "waste_surge"];
        const chosen = types[Math.floor(Math.random() * types.length)];
        if (chosen === "energy_surge") energy *= 2.2 + Math.random() * 1.3;
        else if (chosen === "water_leak") water *= 2.5 + Math.random() * 1.7;
        else if (chosen === "waste_surge") wasteNonRec *= 2.8 + Math.random() * 1.7;
      }

      const wasteTotal = wasteRec + wasteNonRec;
      const carbon = energy * GRID_EMISSION_FACTOR_KG_PER_KWH;

      records.push({
        date: dateStr,
        department: dept,
        energy_kwh: Math.round(energy * 100) / 100,
        water_liters: Math.round(water * 100) / 100,
        waste_recyclable_kg: Math.round(wasteRec * 100) / 100,
        waste_non_recyclable_kg: Math.round(wasteNonRec * 100) / 100,
        waste_total_kg: Math.round(wasteTotal * 100) / 100,
        carbon_kg_co2e: Math.round(carbon * 100) / 100,
        is_anomaly: isAnomaly,
      });
    }
  }

  return records;
}

module.exports = {
  DEPARTMENTS,
  GRID_EMISSION_FACTOR_KG_PER_KWH,
  generateESGDataset,
};

