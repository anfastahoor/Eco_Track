import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const METRIC_CONFIG = {
  energy_kwh: { label: "Energy (kWh)", color: "#0284c7", unit: "kWh" },
  water_liters: { label: "Water (L)", color: "#0d9488", unit: "L" },
  waste_total_kg: { label: "Waste (kg)", color: "#d97706", unit: "kg" },
  carbon_kg_co2e: { label: "Carbon (kg CO₂e)", color: "#dc2626", unit: "kg CO₂e" },
};

const DEPT_COLORS = {
  "HQ Operations": "#10b981",
  "R&D Lab": "#3b82f6",
  "Manufacturing Facility": "#f59e0b",
  "Data Center": "#8b5cf6",
  "Logistics Hub": "#ec4899",
};

export default function TrendChart({ records }) {
  const [selectedMetric, setSelectedMetric] = useState("energy_kwh");
  const [viewMode, setViewMode] = useState("department"); // 'department' or 'total'

  // Pivot data for Recharts: { date, 'HQ Operations': val, 'Data Center': val, total: sum }
  const chartData = useMemo(() => {
    if (!records || records.length === 0) return [];

    const dateMap = {};
    for (const r of records) {
      if (!dateMap[r.date]) {
        dateMap[r.date] = { date: r.date, total: 0 };
      }
      dateMap[r.date][r.department] = r[selectedMetric] || 0;
      dateMap[r.date].total += r[selectedMetric] || 0;
    }

    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [records, selectedMetric]);

  const departments = useMemo(() => {
    if (!records) return [];
    return Array.from(new Set(records.map((r) => r.department)));
  }, [records]);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Resource Consumption Over Time</h3>
          <p className="text-xs text-slate-500">Daily historical tracking and department trajectories</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector Buttons */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium">
            {Object.entries(METRIC_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedMetric === key
                    ? "bg-white text-slate-900 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {cfg.label.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Aggregate / Department toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium">
            <button
              onClick={() => setViewMode("department")}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                viewMode === "department"
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              By Facility
            </button>
            <button
              onClick={() => setViewMode("total")}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                viewMode === "total"
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Org Total
            </button>
          </div>
        </div>
      </div>

      <div className="h-80 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            No records for the selected filters
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} width={65} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />

              {viewMode === "total" ? (
                <Line
                  type="monotone"
                  dataKey="total"
                  name={`Total ${METRIC_CONFIG[selectedMetric].label}`}
                  stroke={METRIC_CONFIG[selectedMetric].color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              ) : (
                departments.map((dept) => (
                  <Line
                    key={dept}
                    type="monotone"
                    dataKey={dept}
                    name={dept}
                    stroke={DEPT_COLORS[dept] || "#64748b"}
                    strokeWidth={1.8}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

