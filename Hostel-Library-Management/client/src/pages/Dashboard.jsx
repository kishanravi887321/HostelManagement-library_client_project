import axios from "axios";
import { useEffect, useState } from "react";
import SeatGrid from "../components/SeatGrid";

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
    const baseUrl = "http://localhost:5000/api/dashboard/stats";
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
    <div className="p-6 space-y-8">
      
      {/* 1. Header Area with Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-bold text-gray-800 select-none">Dashboard Overview</h1>

        {/* Month Filter Selector */}
        <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
          <span className="text-sm font-semibold text-gray-600 px-1">Filter Period:</span>
          <select
            className="border p-1.5 rounded text-sm bg-white font-medium focus:outline-pink-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Time Records</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="custom">Select Specific Month</option>
          </select>

          {filterType === "custom" && (
            <input
              type="month"
              className="border p-1 rounded text-sm bg-white focus:outline-pink-500"
              value={customMonth}
              onChange={(e) => setCustomMonth(e.target.value)}
            />
          )}
        </div>
      </div>

      {/* ================= 🎨 HIGH-CONTRAST STATS GRID ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        
        {/* 🟠 Hostel Students Card */}
        <div className="bg-orange-500 p-5 rounded shadow-md border border-orange-600 text-white flex flex-col justify-between">
          <h2 className="text-orange-100 font-semibold tracking-wide uppercase text-xs">Hostel Students</h2>
          <p className="text-3xl font-extrabold mt-2 text-white drop-shadow-sm">{stats.hostelCount}</p>
        </div>

        {/* 🟡 Library Students Card */}
        <div className="bg-yellow-400 p-5 rounded shadow-md border border-yellow-500 text-white flex flex-col justify-between">
          <h2 className="text-amber-950/80 font-bold tracking-wide uppercase text-xs">Library Students</h2>
          <p className="text-3xl font-extrabold mt-2 text-white drop-shadow-sm">{stats.libraryCount}</p>
        </div>

        {/* 🔵 Online Paid Card */}
        <div className="bg-blue-600 p-5 rounded shadow-md border border-blue-700 text-white flex flex-col justify-between">
          <h2 className="text-blue-100 font-semibold tracking-wide uppercase text-xs">Paid Online</h2>
          <p className="text-3xl font-extrabold mt-2 text-white drop-shadow-sm">
            ₹ {stats.onlineRevenue || 0}
          </p>
        </div>

        {/* 🟤 Cash Collected Card */}
        <div className="bg-amber-700 p-5 rounded shadow-md border border-amber-800 text-white flex flex-col justify-between">
          <h2 className="text-amber-100 font-semibold tracking-wide uppercase text-xs">Paid by Cash</h2>
          <p className="text-3xl font-extrabold mt-2 text-white drop-shadow-sm">
            ₹ {stats.cashRevenue || 0}
          </p>
        </div>

        {/* 🟢 Total Paid Fees Card */}
        <div className="bg-green-600 p-5 rounded shadow-md border border-green-700 text-white flex flex-col justify-between">
          <h2 className="text-green-100 font-semibold tracking-wide uppercase text-xs">Total Paid</h2>
          <p className="text-3xl font-extrabold mt-2 text-white drop-shadow-sm">
            ₹ {stats.paidFees}
          </p>
        </div>

        {/* 🔴 Pending Fees Card */}
        <div className="bg-red-500 p-5 rounded shadow-md border border-red-600 text-white flex flex-col justify-between">
          <h2 className="text-red-100 font-semibold tracking-wide uppercase text-xs">Pending Fees</h2>
          <p className="text-3xl font-extrabold mt-2 text-white drop-shadow-sm">
            ₹ {stats.pendingFees}
          </p>
        </div>

      </div>

      {/* 3. Visual Seat Allocation Grid Section */}
      <div className="bg-purple-50 p-6 rounded shadow-md border border-purple-200">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-purple-900">Seat Allocations Status</h2>
        </div>
        <SeatGrid />
      </div>

    </div>
  );
}