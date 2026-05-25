import axios from "axios";
import { useEffect, useState } from "react";
import SeatGrid from "../components/SeatGrid";
import { API_BASE_URL } from "../config/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    hostelCount: 0,
    libraryCount: 0,
    pendingFees: 0,
    paidFees: 0,
    onlineRevenue: 0, 
    cashRevenue: 0    
  });

  // Month Filter States
  const [filterType, setFilterType] = useState("all"); // Options: all, thisMonth, lastMonth, custom
  const [customMonth, setCustomMonth] = useState("");  // Format: "YYYY-MM"

  useEffect(() => {
    let targetMonth = "";
    const now = new Date();

    // Helper mapping function to safely format text names
    const getMonthName = (monthIndex) => {
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return months[monthIndex];
    };

    if (filterType === "thisMonth") {
      // 🆕 Formats current active month instantly to "May", "June", etc.
      targetMonth = getMonthName(now.getMonth());
    } else if (filterType === "lastMonth") {
      // Handles previous month rollbacks securely across New Year boundaries
      let lastMonthIndex = now.getMonth() - 1;
      if (lastMonthIndex < 0) {
        lastMonthIndex = 11; // Rollback to December
      }
      targetMonth = getMonthName(lastMonthIndex);
    } else if (filterType === "custom" && customMonth) {
      // 🆕 Parses HTML input choice ("2026-05") cleanly into textual month names
      const [year, monthNum] = customMonth.split("-");
      targetMonth = getMonthName(parseInt(monthNum, 10) - 1);
    }

    // 🔗 Bulletproof URL Generation via URLSearchParams
    const baseUrl = `${API_BASE_URL}/api/dashboard/stats`;
    const params = new URLSearchParams();
    
    if (targetMonth) {
      params.append("month", targetMonth);
    }

    const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    console.log("🚀 Sending Request to Endpoint URL:", finalUrl);

    axios.get(finalUrl)
      .then(res => {
        console.log("📥 Received Metrics Payload:", res.data);
        setStats(res.data);
      })
      .catch(err => console.error("❌ Stats Fetching Error:", err));
  }, [filterType, customMonth]); // Triggers immediately when dropdown state modifiers are flipped

  return (
    <div className="space-y-8">
      <div className="panel p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-700">Performance Snapshot</p>
          <h1 className="text-3xl font-semibold text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500">Track revenue, occupancy, and live student metrics.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white/70 border border-[var(--border)] rounded-xl px-3 py-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter Period</span>
          <select
            className="border border-[var(--border)] rounded-lg px-2 py-1 text-sm bg-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Time Records</option>
            <option value="thisMonth">This Months 2</option>
            <option value="lastMonth">Last Month</option>
            <option value="custom">Select Specific Month</option>
          </select>

          {filterType === "custom" && (
            <input
              type="month"
              className="border border-[var(--border)] rounded-lg px-2 py-1 text-sm bg-white"
              value={customMonth}
              onChange={(e) => setCustomMonth(e.target.value)}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="stat-card motion-rise" data-tone="ember">
          <p className="stat-label">Hostel Students</p>
          <p className="stat-value">{stats.hostelCount}</p>
        </div>
        <div className="stat-card motion-rise" data-tone="amber">
          <p className="stat-label">Library Students</p>
          <p className="stat-value">{stats.libraryCount}</p>
        </div>
        <div className="stat-card motion-rise" data-tone="blue">
          <p className="stat-label">Paid Online</p>
          <p className="stat-value">₹ {stats.onlineRevenue || 0}</p>
        </div>
        <div className="stat-card motion-rise" data-tone="amber">
          <p className="stat-label">Paid by Cash</p>
          <p className="stat-value">₹ {stats.cashRevenue || 0}</p>
        </div>
        <div className="stat-card motion-rise" data-tone="forest">
          <p className="stat-label">Total Paid</p>
          <p className="stat-value">₹ {stats.paidFees}</p>
        </div>
        <div className="stat-card motion-rise" data-tone="rose">
          <p className="stat-label">Pending Fees</p>
          <p className="stat-value">₹ {stats.pendingFees}</p>
        </div>
      </div>

      <div className="panel p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Seat Allocations Status</h2>
          <p className="text-sm text-slate-500">Live overview of library desk occupancy.</p>
        </div>
        <SeatGrid />
      </div>
    </div>
  );
}