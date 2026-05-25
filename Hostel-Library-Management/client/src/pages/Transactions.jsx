import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

function toLocalDateInputValue(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (!isFinite(dt)) return "";
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Transactions() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const fetchTx = async (opts = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const ffrom = opts.from ?? fromDate;
      const fto = opts.to ?? toDate;
      const src = opts.source ?? sourceFilter;
      const sterm = opts.search ?? searchTerm;
      const p = opts.page ?? page;
      const ps = opts.pageSize ?? pageSize;

      if (ffrom) params.set("from", ffrom);
      if (fto) params.set("to", fto);
      if (src && src !== "all") params.set("source", src);
      if (sterm) params.set("studentName", sterm);
      params.set("page", String(p));
      params.set("pageSize", String(ps));

      const url = `${API_BASE_URL}/api/transactions?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      setTxs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTx();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, sourceFilter, searchTerm, page, pageSize]);

  // server returns already-filtered/paginated results
  const filtered = txs || [];

  const exportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (sourceFilter && sourceFilter !== "all") params.set("source", sourceFilter);
      if (searchTerm) params.set("studentName", searchTerm);
      params.set("export", "csv");

      const url = `${API_BASE_URL}/api/transactions?${params.toString()}`;
      const res = await fetch(url);
      const blob = await res.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = `transactions_${new Date().toISOString().slice(0,19).replace(/[:T]/g, "-")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transactions Audit</h2>
          <p className="text-sm text-gray-500">All transactions (payments, advance top-ups, adjustments) across students.</p>
        </div>
        <div className="space-x-2 flex items-center">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn-ghost">Prev</button>
          <span className="text-sm px-2">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} className="btn-ghost">Next</button>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border p-1 rounded ml-2">
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
          <button onClick={exportCSV} className="btn-primary ml-3">Export CSV</button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-xs text-gray-500">From:</label>
        <input type="date" className="border p-1 rounded" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <label className="text-xs text-gray-500">To:</label>
        <input type="date" className="border p-1 rounded" value={toDate} onChange={(e) => setToDate(e.target.value)} />

        <label className="text-xs text-gray-500">Source:</label>
        <select className="border p-1 rounded" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="Hostel">Hostel</option>
          <option value="Library">Library</option>
        </select>

        <input className="border p-1 rounded flex-1" placeholder="Search student or note" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="table-shell">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Student</th>
              <th className="p-2">Source</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Mode</th>
              <th className="p-2">Applied To Due</th>
              <th className="p-2">Added To Advance</th>
              <th className="p-2">Note</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y">
            {loading ? (
              <tr><td colSpan="8" className="p-6 text-center">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="8" className="p-6 text-center text-gray-500">No transactions found for selected filters.</td></tr>
            ) : (
              filtered.map((t, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition">
                  <td className="p-2">{t.date ? new Date(t.date).toLocaleString() : "-"}</td>
                  <td className="p-2 font-medium">{t.studentName}</td>
                  <td className="p-2">{t.source}</td>
                  <td className="p-2">₹{t.amount}</td>
                  <td className="p-2">{t.mode}</td>
                  <td className="p-2">₹{t.appliedToDue || 0}</td>
                  <td className="p-2">₹{t.addedToAdvance || 0}</td>
                  <td className="p-2 text-gray-600">{t.note}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
