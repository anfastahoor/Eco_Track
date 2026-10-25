import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Recycle } from "lucide-react";

export default function WasteDonut({ wasteData }) {
  const { recyclable_kg = 0, non_recyclable_kg = 0, diversion_rate_pct = 0 } = wasteData || {};

  const chartData = [
    { name: "Recyclable Waste", value: recyclable_kg, color: "#10b981" },
    { name: "Non-Recyclable Waste", value: non_recyclable_kg, color: "#94a3b8" },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Circular Economy Stream</h3>
          <p className="text-xs text-slate-500">Recyclable vs non-recyclable waste</p>
        </div>
        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
          <Recycle className="w-5 h-5" />
        </div>
      </div>

      <div className="relative h-56 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={65}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
              }}
              formatter={(val) => [`${Number(val).toLocaleString()} kg`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Annotation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold text-emerald-700 tracking-tight">
            {diversion_rate_pct}%
          </span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Diversion Rate
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 font-medium">Recyclable Stream</span>
          </div>
          <span className="font-bold text-slate-900">{Number(recyclable_kg).toLocaleString()} kg</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span className="text-slate-600 font-medium">Non-Recyclable Stream</span>
          </div>
          <span className="font-bold text-slate-900">{Number(non_recyclable_kg).toLocaleString()} kg</span>
        </div>
      </div>
    </div>
  );
}

