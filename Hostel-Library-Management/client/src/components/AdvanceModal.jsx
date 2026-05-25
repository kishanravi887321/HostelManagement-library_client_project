import axios from "axios";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

export default function AdvanceModal({ open, onClose, studentId, basePath, onUpdated, studentName }) {
  const [loading, setLoading] = useState(false);
  const [advance, setAdvance] = useState(0);
  const [payments, setPayments] = useState([]);
  const [amount, setAmount] = useState("");
  const [operation, setOperation] = useState("credit");
  const [mode, setMode] = useState("Admin");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !studentId) return;
    const fetchAdvance = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/${basePath}/${studentId}/advance`);
        setAdvance(res.data.advanceAmount || 0);
        setPayments(Array.isArray(res.data.payments) ? res.data.payments : []);
      } catch (err) {
        console.error("Failed to fetch advance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdvance();
  }, [open, studentId, basePath]);

  if (!open) return null;

  const submitAdjust = async () => {
    if (!amount) return alert("Enter an amount");
    setSubmitting(true);
    try {
      const n = Number(amount);
      if (!Number.isFinite(n) || n < 0) {
        alert("Negative values are not allowed in payment fields.");
        setSubmitting(false);
        return;
      }
      if (operation === "debit" && n > Number(advance || 0)) {
        alert("Insufficient advance balance.");
        setSubmitting(false);
        return;
      }

      await axios.post(`${API_BASE_URL}/api/${basePath}/${studentId}/advance`, { amount: n, mode, note, operation });
      // refresh
      const res = await axios.get(`${API_BASE_URL}/api/${basePath}/${studentId}/advance`);
      setAdvance(res.data.advanceAmount || 0);
      setPayments(Array.isArray(res.data.payments) ? res.data.payments : []);
      setAmount("");
      setOperation("credit");
      setNote("");
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error(err);
      alert("Failed to adjust advance: " + (err?.message || ""));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white w-96 max-h-[80vh] overflow-y-auto rounded-lg p-4 shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">Advance — {studentName || studentId}</h3>
          <button onClick={onClose} className="text-gray-600">Close</button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-600">Loading...</div>
        ) : (
          <>
            <div className="mb-3">
              <div className="text-xs text-gray-500">Current Advance Balance</div>
              <div className="text-lg font-semibold text-blue-700">₹{advance}</div>
            </div>

            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1">Adjust Advance</div>
              <select className="border p-2 w-full rounded text-sm mb-2" value={operation} onChange={(e) => setOperation(e.target.value)}>
                <option value="credit">Top-up (Credit)</option>
                <option value="debit">Withdraw (Debit)</option>
              </select>
              <input type="number" min="0" className="border p-2 w-full rounded text-sm mb-2" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (e.g. 500)" />
              <input type="text" className="border p-2 w-full rounded text-sm mb-2" value={mode} onChange={(e) => setMode(e.target.value)} placeholder="Mode (Admin, Cash, Online)" />
              <input type="text" className="border p-2 w-full rounded text-sm mb-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
              <div className="flex justify-end">
                <button className="btn-ghost mr-2" onClick={() => { setAmount(""); setOperation("credit"); setNote(""); }}>Reset</button>
                <button className="btn-primary" onClick={submitAdjust} disabled={submitting}>{submitting ? 'Saving...' : 'Apply'}</button>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">Payments / Advance History</div>
              <div className="space-y-2 text-xs">
                {payments.length === 0 ? (
                  <div className="text-gray-400">No payments recorded.</div>
                ) : (
                  payments.slice().reverse().map((p, i) => (
                    <div key={i} className="p-2 border rounded">
                      <div className="flex justify-between text-[12px]"><div className="font-medium">₹{p.amount}</div><div className="text-gray-500">{new Date(p.date).toLocaleString()}</div></div>
                      <div className="text-[11px] text-gray-600">Mode: {p.mode || '—'} · Applied: ₹{p.appliedToDue || 0} · To Advance: ₹{p.addedToAdvance || 0}</div>
                      {p.note && <div className="text-[11px] text-gray-500 mt-1">{p.note}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
