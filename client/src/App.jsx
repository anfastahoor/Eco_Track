import React, { lazy, Suspense, useState, useEffect } from "react";
import {
  Zap,
  Droplet,
  Trash2,
  Globe2,
  Calendar,
  Building2,
  RefreshCw,
  Leaf,
  Filter,
} from "lucide-react";

import KPICard from "./components/KPICard";
import { requestJson } from "./api";

const TrendChart = lazy(() => import("./components/TrendChart"));
const DeptBarChart = lazy(() => import("./components/DeptBarChart"));
const WasteDonut = lazy(() => import("./components/WasteDonut"));
const AnomalyTable = lazy(() => import("./components/AnomalyTable"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));

const ALL_DEPARTMENTS = [
  "HQ Operations",
  "R&D Lab",
  "Manufacturing Facility",
  "Data Center",
  "Logistics Hub",
];

export default function App() {
  // Filter States
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDepts, setSelectedDepts] = useState(ALL_DEPARTMENTS);

  // Anomaly Multiplier State
  const [multiplier, setMultiplier] = useState(2.0);

  // Data States
  const [dateBounds, setDateBounds] = useState({ minDate: "", maxDate: "" });
  const [records, setRecords] = useState([]);
  const [kpiSummary, setKpiSummary] = useState(null);
  const [deptBreakdown, setDeptBreakdown] = useState([]);
  const [wasteData, setWasteData] = useState(null);
  const [anomalies, setAnomalies] = useState([]);

  // Request state
  const [isReseeding, setIsReseeding] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState("checking");
  const [canReseed, setCanReseed] = useState(false);
  const [dataRevision, setDataRevision] = useState(0);

  // 1. Initial Load: Fetch Date Bounds
  useEffect(() => {
    const controller = new AbortController();
    async function init() {
      try {
        const health = await requestJson("/api/health", {
          signal: controller.signal,
        });
        if (health.status !== "ok") throw new Error("API health check failed.");
        setCanReseed(health.canReseed === true);
        const bounds = await requestJson("/api/metrics/bounds", {
          signal: controller.signal,
        });
        setApiStatus("online");
        if (bounds.minDate && bounds.maxDate) {
          setDateBounds({ minDate: bounds.minDate, maxDate: bounds.maxDate });
          setStartDate(bounds.minDate);
          setEndDate(bounds.maxDate);
          setDataRevision((revision) => revision + 1);
        } else {
          setError("No metrics found. Use the Admin Panel to generate a dataset.");
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setApiStatus("offline");
          setError(`Unable to connect to the API: ${err.message}`);
        }
      }
    }
    init();
    return () => controller.abort();
  }, []);

  // 2. Handle Preset Changes
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    if (!dateBounds.maxDate) return;

    const max = new Date(dateBounds.maxDate);
    if (preset === "all") {
      setStartDate(dateBounds.minDate);
      setEndDate(dateBounds.maxDate);
    } else if (preset === "90") {
      const start = new Date(max.getTime() - 90 * 24 * 60 * 60 * 1000);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(dateBounds.maxDate);
    } else if (preset === "30") {
      const start = new Date(max.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(dateBounds.maxDate);
    }
  };

  // 3. Fetch Dashboard Data whenever filters or multiplier change
  useEffect(() => {
    if (!startDate || !endDate) return;

    const controller = new AbortController();
    async function fetchData() {
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          startDate,
          endDate,
          departments: selectedDepts.join(","),
        });

        const dashboard = await requestJson(
          `/api/kpi/dashboard?${queryParams}&multiplier=${multiplier}`,
          { signal: controller.signal }
        );

        if (!controller.signal.aborted) {
          setRecords(dashboard.records);
          setKpiSummary({
            summary: dashboard.summary,
            mom: dashboard.mom,
          });
          setDeptBreakdown(dashboard.departments);
          setWasteData(dashboard.waste);
          setAnomalies(dashboard.anomalies);
          setApiStatus("online");
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setApiStatus("offline");
          setError(`Failed to load dashboard data: ${err.message}`);
        }
      }
    }

    fetchData();
    return () => controller.abort();
  }, [startDate, endDate, selectedDepts, multiplier, dataRevision]);

  // Handle Department Toggle
  const toggleDept = (dept) => {
    if (selectedDepts.includes(dept)) {
      if (selectedDepts.length > 1) {
        setSelectedDepts(selectedDepts.filter((d) => d !== dept));
      }
    } else {
      setSelectedDepts([...selectedDepts, dept]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedDepts.length === ALL_DEPARTMENTS.length) {
      setSelectedDepts([ALL_DEPARTMENTS[0]]);
    } else {
      setSelectedDepts(ALL_DEPARTMENTS);
    }
  };

  // Trigger Database Re-seeding
  const handleReseed = async () => {
    setIsReseeding(true);
    setError(null);
    try {
      await requestJson("/api/metrics/seed", { method: "POST" });
      const bounds = await requestJson("/api/metrics/bounds");
      if (!bounds.minDate || !bounds.maxDate) {
        throw new Error("The dataset was seeded but no date range was returned.");
      }
      setDateBounds({ minDate: bounds.minDate, maxDate: bounds.maxDate });
      setStartDate(bounds.minDate);
      setEndDate(bounds.maxDate);
      setDataRevision((revision) => revision + 1);
    } catch (err) {
      setError(`Failed to regenerate data: ${err.message}`);
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-emerald-900 text-white px-6 py-4 shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-800 rounded-xl">
              <Leaf className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">EcoTrack</h1>
              <p className="text-xs text-emerald-300 font-medium">
                Enterprise ESG Analytics Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span
              className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full border ${
                apiStatus === "online"
                  ? "bg-emerald-800/80 text-emerald-200 border-emerald-700"
                  : apiStatus === "offline"
                    ? "bg-red-900/80 text-red-200 border-red-700"
                    : "bg-slate-800 text-slate-200 border-slate-700"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 ${
                  apiStatus === "online"
                    ? "bg-emerald-400 animate-pulse"
                    : apiStatus === "offline"
                      ? "bg-red-400"
                      : "bg-slate-400"
                }`}
              />
              API {apiStatus === "checking" ? "Checking..." : apiStatus}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-72 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm h-fit space-y-6 shrink-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
              <Filter className="w-4 h-4 mr-1.5 text-emerald-600" /> Filter Controls
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {records.length} records
            </span>
          </div>

          {/* Date Presets */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-2 block">Quick Date Presets</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-medium">
              {[
                { id: "all", label: "All Time" },
                { id: "90", label: "90 Days" },
                { id: "30", label: "30 Days" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id)}
                  className={`py-1.5 rounded-lg text-center transition-all ${
                    datePreset === p.id
                      ? "bg-white text-slate-900 shadow-sm font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Start Date</label>
              <input
                type="date"
                value={startDate}
                min={dateBounds.minDate}
                max={endDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={dateBounds.maxDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Facility Multi-Select */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">Facilities ({selectedDepts.length}/5)</label>
              <button
                onClick={toggleSelectAll}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
              >
                {selectedDepts.length === ALL_DEPARTMENTS.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="space-y-1.5">
              {ALL_DEPARTMENTS.map((dept) => {
                const isChecked = selectedDepts.includes(dept);
                return (
                  <label
                    key={dept}
                    onClick={() => toggleDept(dept)}
                    className={`flex items-center p-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                      isChecked ? "bg-emerald-50 text-emerald-900 border border-emerald-100" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent label click
                      className="rounded text-emerald-600 focus:ring-emerald-500 mr-2.5 h-3.5 w-3.5"
                    />
                    <span className="truncate">{dept}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Environmental Scope Notice */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <p><b>Scope 2 Factor:</b> 0.71 kg CO₂e / kWh</p>
            <p><b>Backend:</b> Express.js & MongoDB</p>
            <p><b>Frontend:</b> React 18 & Recharts</p>
          </div>
        </aside>

        {/* Main Dashboard Content */}
        <main className="flex-1 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard
              title="Total Energy"
              value={kpiSummary?.summary?.total_energy_kwh}
              unit="kWh"
              mom={kpiSummary?.mom?.energy_kwh}
              icon={Zap}
            />
            <KPICard
              title="Total Water"
              value={kpiSummary?.summary?.total_water_liters}
              unit="Liters"
              mom={kpiSummary?.mom?.water_liters}
              icon={Droplet}
            />
            <KPICard
              title="Total Waste"
              value={kpiSummary?.summary?.total_waste_kg}
              unit="kg"
              mom={kpiSummary?.mom?.waste_total_kg}
              icon={Trash2}
            />
            <KPICard
              title="Carbon Footprint"
              value={kpiSummary?.summary?.total_carbon_kg}
              unit="kg CO₂e"
              mom={kpiSummary?.mom?.carbon_kg_co2e}
              icon={Globe2}
            />
          </div>

          {/* Secondary Highlight Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between text-xs gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-500">Active Span:</span>
              <span className="font-bold text-slate-800">
                {kpiSummary?.summary?.days_count || 0} days ({records.length} records)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-500">Waste Diversion Rate:</span>
              <span className="font-bold text-emerald-700">
                {wasteData?.diversion_rate_pct || 0}% recyclable
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-slate-500">Grid Carbon Intensity:</span>
              <span className="font-bold text-slate-800">0.71 kg CO₂e / kWh</span>
            </div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span className="text-slate-500">Active Facilities:</span>
              <span className="font-bold text-slate-800">
                {selectedDepts.length} of {ALL_DEPARTMENTS.length}
              </span>
            </div>
          </div>

          {/* Charts Row 1: Trend Line & Waste Donut */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <Suspense fallback={<div className="h-64 rounded-2xl bg-white animate-pulse" />}>
                <TrendChart records={records} />
              </Suspense>
            </div>
            <div>
              <Suspense fallback={<div className="h-64 rounded-2xl bg-white animate-pulse" />}>
                <WasteDonut wasteData={wasteData} />
              </Suspense>
            </div>
          </div>

          {/* Charts Row 2: Facility Benchmarking Bar Chart */}
          <div>
            <Suspense fallback={<div className="h-64 rounded-2xl bg-white animate-pulse" />}>
              <DeptBarChart departments={deptBreakdown} />
            </Suspense>
          </div>

          {/* Anomaly Incident Alert Log Table */}
          <div>
            <Suspense fallback={<div className="h-48 rounded-2xl bg-white animate-pulse" />}>
              <AnomalyTable anomalies={anomalies} multiplier={multiplier} />
            </Suspense>
          </div>

          {/* Admin Tuning & Database Reseed Panel */}
          <div>
            <Suspense fallback={<div className="h-20 rounded-2xl bg-white animate-pulse" />}>
              <AdminPanel
                multiplier={multiplier}
                setMultiplier={setMultiplier}
                onReseed={handleReseed}
                isReseeding={isReseeding}
                anomalyCount={anomalies.length}
                canReseed={canReseed}
              />
            </Suspense>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        EcoTrack ESG Analytics Dashboard • Full MERN Stack Implementation • MongoDB • Express • React • Node.js
      </footer>
    </div>
  );
}
