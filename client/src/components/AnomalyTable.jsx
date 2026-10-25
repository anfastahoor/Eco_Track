import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AnomalyTable({ anomalies = [], multiplier = 2.0 }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Statistical Anomaly & Threshold Alerts</h3>
            <p className="text-xs text-slate-500">
              Rule: <span className="font-mono text-slate-700">Upper Limit = μ + {multiplier}σ</span> • Outlier incidents
            </p>
          </div>
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 self-start sm:self-auto">
          {anomalies.length} Incidents Flagged
        </span>
      </div>

      {anomalies.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
          <p className="text-sm font-semibold text-slate-800">All Systems Nominal</p>
          <p className="text-xs text-slate-400 mt-1">
            No consumption anomalies detected at the {multiplier}σ threshold multiplier.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Facility</th>
                <th className="py-2.5 px-3">Metric Exceeded</th>
                <th className="py-2.5 px-3 text-right">Observed Value</th>
                <th className="py-2.5 px-3 text-right">Baseline Mean (μ)</th>
                <th className="py-2.5 px-3 text-right">Threshold (μ+{multiplier}σ)</th>
                <th className="py-2.5 px-3 text-right">% Over Mean</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {anomalies.map((a, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-mono text-slate-600">{a.date}</td>
                  <td className="py-2 px-3 font-medium text-slate-900">{a.department}</td>
                  <td className="py-2 px-3">
                    <span className="inline-flex px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700">
                      {a.metric}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-amber-700">
                    {Number(a.value).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-500">
                    {Number(a.department_mean).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-500">
                    {Number(a.threshold).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span className="inline-flex px-2 py-0.5 rounded-full font-bold text-[11px] bg-red-100 text-red-700">
                      +{a.pct_over_mean}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

