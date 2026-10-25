const mongoose = require("mongoose");

const DailyMetricSchema = new mongoose.Schema(
  {
    date: {
      type: String, // ISO format: YYYY-MM-DD
      required: true,
      index: true,
    },
    department: {
      type: String,
      required: true,
      index: true,
    },
    energy_kwh: {
      type: Number,
      required: true,
    },
    water_liters: {
      type: Number,
      required: true,
    },
    waste_recyclable_kg: {
      type: Number,
      required: true,
    },
    waste_non_recyclable_kg: {
      type: Number,
      required: true,
    },
    waste_total_kg: {
      type: Number,
      required: true,
    },
    carbon_kg_co2e: {
      type: Number,
      required: true,
    },
    is_anomaly: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Composite unique index ensures idempotent inserts
DailyMetricSchema.index({ date: 1, department: 1 }, { unique: true });

module.exports = mongoose.model("DailyMetric", DailyMetricSchema);

