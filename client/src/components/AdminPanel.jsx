import React, { useState } from "react";
import { Sliders, RefreshCw } from "lucide-react";

export default function AdminPanel({
  multiplier,
  setMultiplier,
  onReseed,
  isReseeding,
  anomalyCount,
  canReseed,
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Admin Panel — Threshold Sensitivity & Database Management
            </h4>
            <p className="text-xs text-slate-500">
              Tune Gaussian standard deviation multiplier (k) and regenerate dataset
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
          {isOpen ? "Collapse" : "Expand"}
        </span>
      </button>

      {isOpen && (
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-6">
          {/* Dynamic Slider Section */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Anomaly Sensitivity Multiplier (k × Standard Deviation)
                </label>
                <p className="text-xs text-slate-500">
                  Lower values increase sensitivity (flag subtle leaks); higher values restrict alerts to severe outliers.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500">Current Multiplier:</span>
                <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold text-sm rounded-lg shadow-sm">
                  {multiplier.toFixed(1)}σ
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold text-slate-500">1.0σ (Sensitive)</span>
              <input
                type="range"
                min="1.0"
                max="4.0"
                step="0.1"
                value={multiplier}
                onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <span className="text-xs font-bold text-slate-500">4.0σ (Strict)</span>
            </div>

            <div className="mt-3 text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
              <span>
                Incidents flagged at <b>{multiplier.toFixed(1)}σ</b>:
              </span>
              <span className="font-extrabold text-amber-600">{anomalyCount} incidents</span>
            </div>
          </div>

          {canReseed && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Database Re-seeding
                </h5>
                <p className="text-xs text-slate-500">
                  Regenerates 12 months of fresh daily ESG records across all 5 facilities with random variation.
                </p>
              </div>

              <button
                onClick={onReseed}
                disabled={isReseeding}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50 whitespace-nowrap shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isReseeding ? "animate-spin" : ""}`} />
                {isReseeding ? "Re-seeding Records..." : "Re-generate Synthetic Data"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
