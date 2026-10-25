import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

const METRIC_OPTIONS = [
  { key: "energy_kwh", label: "Energy (kWh)", color: "#0284c7" },
  { key: "carbon_kg_co2e", label: "Carbon (kg CO₂e)", color: "#dc2626" },
  { key: "water_liters", label: "Water (L)", color: "#0d9488" },
  { key: "waste_total_kg", label: "Waste (kg)", color: "#d97706" },
];

export default function DeptBarChart({ departments = [] }) {
  const [metricKey, setMetricKey] = useState("energy_kwh");
  const activeMetric = METRIC_OPTIONS.find((m) => m.key === metricKey) || METRIC_OPTIONS[0];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Cross-Facility Benchmarking</h3>
          <p className="text-xs text-slate-500">Comparative usage across facilities</p>
        </div>

        <select
          value={metricKey}
          onChange={(e) => setMetricKey(e.target.value)}
          className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {METRIC_OPTIONS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="h-64 w-full">
        {departments.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            No department data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departments} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis
                type="category"
                dataKey="department"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                tickLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
                formatter={(val) => [`${Number(val).toLocaleString()} ${activeMetric.label.split(" ")[1]}`, activeMetric.label]}
              />
              <Bar dataKey={metricKey} fill={activeMetric.color} radius={[0, 8, 8, 0]}>
                {departments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={activeMetric.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {departments.map((d) => (
          <div key={d.department} className="p-2 bg-slate-50 rounded-xl text-center">
            <p className="text-[10px] font-medium text-slate-500 truncate">{d.department}</p>
            <p className="text-xs font-bold text-slate-800">{d.carbon_share_pct}% CO₂e</p>
          </div>
        ))}
      </div>
    </div>
  );
}

