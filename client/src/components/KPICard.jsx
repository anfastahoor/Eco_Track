import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

export default function KPICard({ title, value, unit, mom, icon: Icon, color = "emerald" }) {
  const isPositive = mom?.pct_change > 0;
  const isNegative = mom?.pct_change < 0;

  // In ESG, drops in energy/water/waste/carbon are good (green), increases are warnings (amber/red)
  const isReductionGood = true;
  const deltaBadgeColor = isNegative
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : isPositive
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="p-2.5 rounded-xl bg-slate-50 text-emerald-600 border border-slate-100">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline space-x-2 mb-3">
        <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          {Number(value || 0).toLocaleString()}
        </span>
        <span className="text-sm font-medium text-slate-500">{unit}</span>
      </div>

      {mom && (
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${deltaBadgeColor}`}>
            {isPositive && <TrendingUp className="w-3.5 h-3.5 mr-1" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5 mr-1" />}
            {mom.pct_change > 0 ? `+${mom.pct_change}%` : `${mom.pct_change}%`} MoM
          </span>
          <span className="text-xs text-slate-400">vs prior period</span>
        </div>
      )}
    </div>
  );
}

