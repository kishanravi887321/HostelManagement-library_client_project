import axios from "axios";
import { useEffect, useState } from "react";
import AdvanceModal from "../components/AdvanceModal";
import { API_BASE_URL } from "../config/api";

export default function Students() {
  const [students, setStudents] = useState([]);

  // Filter States
  const [filterType, setFilterType] = useState("all"); 
  const [filterCriteria, setFilterCriteria] = useState("joining"); 
  const [customMonth, setCustomMonth] = useState("");  

  // 🆕 Track the physical file instance explicitly
  const [selectedFile, setSelectedFile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    roomNo: "",
    feeStatus: "Pending",
    sharingType: "Single",
    amountPaid: "",
    amountPaidOnline: "",
    amountPaidCash: "",
    amountDue: "",
    paymentMode: "Online",
    isAdvancePayment: false,
    advanceAmount: "",
    dateOfJoining: "",
    lastPaymentDate: ""
  });

  const [editingStudent, setEditingStudent] = useState(null);
  const [advanceOpenFor, setAdvanceOpenFor] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    roomNo: "",
    feeStatus: "Pending",
    sharingType: "Single",
    amountPaid: "",
    amountPaidOnline: "",
    amountPaidCash: "",
    amountDue: "",
    paymentReceivedNow: "",
    paymentReceivedOnlineNow: "",
    paymentReceivedCashNow: "",
    paymentReceivedMode: "Online",
    paymentMode: "Online",
    isAdvancePayment: false,
    advanceTopUp: "",
    useAdvance: false,
    advanceAmount: "",
    dateOfJoining: "",
    lastPaymentDate: "",
    identityProof: ""
  });

  const editPaymentSummary = (student) => {
    const mode = String(student.paymentMode || "Online").toLowerCase();

    if (mode === "split") {
      return {
        online: Number(student.amountPaidOnline) || 0,
        cash: Number(student.amountPaidCash) || 0,
        total: Number(student.amountPaid) || 0,
      };
    }

    if (mode === "cash") {
      return {
        online: 0,
        cash: Number(student.amountPaid) || 0,
        total: Number(student.amountPaid) || 0,
      };
    }

    return {
      online: Number(student.amountPaid) || 0,
      cash: 0,
      total: Number(student.amountPaid) || 0,
    };
  };

  const isSplitPayment = form.paymentMode === "Split";
  const amountPaidTotal = isSplitPayment
    ? (Number(form.amountPaidOnline) || 0) + (Number(form.amountPaidCash) || 0)
    : (Number(form.amountPaid) || 0);

  const paymentSummary = (student) => {
    const mode = String(student.paymentMode || "Online").toLowerCase();

    if (mode === "split") {
      return {
        online: Number(student.amountPaidOnline) || 0,
        cash: Number(student.amountPaidCash) || 0,
        total: Number(student.amountPaid) || 0,
      };
    }

    if (mode === "cash") {
      return {
        online: 0,
        cash: Number(student.amountPaid) || 0,
        total: Number(student.amountPaid) || 0,
      };
    }

    return {
      online: Number(student.amountPaid) || 0,
      cash: 0,
      total: Number(student.amountPaid) || 0,
    };
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/students`);
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 🛠️ Updated to completely leverage Multipart FormData Streams
  const addStudent = async () => {
    try {
      const hasNegative = [
        form.amountPaid,
        form.amountPaidOnline,
        form.amountPaidCash,
        form.amountDue,
        form.advanceAmount
      ].some((v) => v !== "" && Number(v) < 0);
      if (hasNegative) {
        alert("Negative values are not allowed in payment fields.");
        return;
      }

      const parsedAmountDue = Number(form.amountDue) || 0;
      const calculatedFeeStatus = parsedAmountDue > 0 ? "Pending" : "Paid";

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("phone", form.phone);
      formData.append("roomNo", form.roomNo);
      formData.append("sharingType", form.sharingType);
      formData.append("amountPaid", amountPaidTotal);
      formData.append("amountPaidOnline", isSplitPayment ? Number(form.amountPaidOnline) || 0 : 0);
      formData.append("amountPaidCash", isSplitPayment ? Number(form.amountPaidCash) || 0 : 0);
      formData.append("amountDue", parsedAmountDue);
      formData.append("feeStatus", calculatedFeeStatus);
      formData.append("paymentMode", form.paymentMode);
      formData.append("advanceAmount", Number(form.advanceAmount) || 0);
      formData.append("paymentReceivedNow", Number(form.amountPaid) || 0);
      formData.append("paymentReceivedOnlineNow", isSplitPayment ? Number(form.amountPaidOnline) || 0 : (form.paymentMode === "Online" ? Number(form.amountPaid) || 0 : 0));
      formData.append("paymentReceivedCashNow", isSplitPayment ? Number(form.amountPaidCash) || 0 : (form.paymentMode === "Cash" ? Number(form.amountPaid) || 0 : 0));
      formData.append("isAdvancePayment", form.isAdvancePayment);
      formData.append("dateOfJoining", form.dateOfJoining);
      formData.append("lastPaymentDate", form.lastPaymentDate);
      
      // Append physical file binary stream if chosen
      if (selectedFile) {
        formData.append("identityProof", selectedFile);
      }

      await axios.post(`${API_BASE_URL}/api/students/add`, formData);
      
      // Reset Form State
      setForm({ 
        name: "", 
        phone: "", 
        roomNo: "", 
        feeStatus: "Pending",
        sharingType: "Single",
        amountPaid: "",
        amountPaidOnline: "",
        amountPaidCash: "",
        amountDue: "",
        paymentMode: "Online",
        isAdvancePayment: false,
        advanceAmount: "",
        dateOfJoining: "",
        lastPaymentDate: ""
      });
      setSelectedFile(null); // Clear file
      
      // Reset file input element field visually
      const fileInput = document.getElementById("identityProofInput");
      if (fileInput) fileInput.value = "";

      fetchStudents();
    } catch (err) {
      console.log(err);
    }
  };

  const deleteStudent = async (id) => {
    if (window.confirm("Are you sure you want to permanently remove this hostel student record?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/students/${id}`);
        fetchStudents();
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name || "",
      phone: student.phone || "",
      roomNo: student.roomNo || "",
      feeStatus: student.feeStatus || "Pending",
      sharingType: student.sharingType || "Single",
      amountPaid: student.amountPaid !== undefined ? student.amountPaid : "",
      amountPaidOnline: student.amountPaidOnline !== undefined ? student.amountPaidOnline : "",
      amountPaidCash: student.amountPaidCash !== undefined ? student.amountPaidCash : "",
      amountDue: student.amountDue !== undefined ? student.amountDue : "",
      paymentReceivedNow: "",
      paymentReceivedOnlineNow: "",
      paymentReceivedCashNow: "",
      paymentReceivedMode: student.paymentMode || "Online",
      paymentMode: student.paymentMode || "Online",
      isAdvancePayment: student.isAdvancePayment || false,
      dateOfJoining: student.dateOfJoining || "",
      lastPaymentDate: student.lastPaymentDate || "",
      identityProof: student.identityProof || ""
    });
  };

  const updateStudent = async () => {
    try {
      const hasNegative = [
        editForm.amountPaid,
        editForm.amountPaidOnline,
        editForm.amountPaidCash,
        editForm.amountDue,
        editForm.paymentReceivedNow,
        editForm.paymentReceivedOnlineNow,
        editForm.paymentReceivedCashNow,
        editForm.advanceTopUp
      ].some((v) => v !== "" && Number(v) < 0);
      if (hasNegative) {
        alert("Negative values are not allowed in payment fields.");
        return;
      }

      const parsedAmountDue = Number(editForm.amountDue) || 0;
      const previousOnline = Number(editForm.amountPaidOnline) || 0;
      const previousCash = Number(editForm.amountPaidCash) || 0;

      const receivedOnlineNow = editForm.paymentReceivedMode === "Split"
        ? (Number(editForm.paymentReceivedOnlineNow) || 0)
        : (editForm.paymentReceivedMode === "Online" ? (Number(editForm.paymentReceivedNow) || 0) : 0);

      const receivedCashNow = editForm.paymentReceivedMode === "Split"
        ? (Number(editForm.paymentReceivedCashNow) || 0)
        : (editForm.paymentReceivedMode === "Cash" ? (Number(editForm.paymentReceivedNow) || 0) : 0);

      const receivedNow = receivedOnlineNow + receivedCashNow;
      const nextOnline = previousOnline + receivedOnlineNow;
      const nextCash = previousCash + receivedCashNow;
      const nextTotalPaid = nextOnline + nextCash;
      const nextAmountDue = Math.max(parsedAmountDue - receivedNow, 0);
      const calculatedFeeStatus = nextAmountDue > 0 ? "Pending" : "Paid";
      const nextPaymentMode = nextOnline > 0 && nextCash > 0
        ? "Split"
        : nextCash > 0
          ? "Cash"
          : "Online";

      const payload = {
        ...editForm,
        amountPaid: nextTotalPaid,
        amountPaidOnline: nextOnline,
        amountPaidCash: nextCash,
        amountDue: nextAmountDue,
        feeStatus: calculatedFeeStatus,
        paymentMode: nextPaymentMode
      };

      await axios.put(`${API_BASE_URL}/api/students/${editingStudent._id}`, payload);
      setEditingStudent(null);
      fetchStudents();
    } catch (err) {
      console.log(err);
    }
  };

  const getTargetPeriod = () => {
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetMonthIndex = now.getMonth();

    if (filterType === "lastMonth") {
      targetMonthIndex = targetMonthIndex === 0 ? 11 : targetMonthIndex - 1;
      targetYear = now.getMonth() === 0 ? targetYear - 1 : targetYear;
    } else if (filterType === "custom" && customMonth) {
      const [year, month] = customMonth.split("-").map(Number);
      targetYear = year;
      targetMonthIndex = month - 1;
    }

    return { targetYear, targetMonthIndex };
  };

  const matchDate = (dateString, targetYear, targetMonthIndex) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return false;
    return d.getFullYear() === targetYear && d.getMonth() === targetMonthIndex;
  };

  const { targetYear, targetMonthIndex } = getTargetPeriod();

  const filteredStudents = students.filter((s) => {
    if (filterType === "all") return true;
    const dateToCompare = filterCriteria === "joining" ? s.dateOfJoining : s.lastPaymentDate;
    return matchDate(dateToCompare, targetYear, targetMonthIndex);
  });

  const filteredPaidAmount = students.reduce((sum, s) => {
    if (filterType === "all" || matchDate(s.lastPaymentDate, targetYear, targetMonthIndex)) {
      return sum + (Number(s.amountPaid) || 0);
    }
    return sum;
  }, 0);

  const filteredPendingAmount = students.reduce((sum, s) => {
    if (filterType === "all" || matchDate(s.lastPaymentDate, targetYear, targetMonthIndex)) {
      return sum + (Number(s.amountDue) || 0);
    }
    return sum;
  }, 0);

  const onlinePaidAmount = students.reduce((sum, s) => {
    const payment = paymentSummary(s);
    if (filterType === "all" || matchDate(s.lastPaymentDate, targetYear, targetMonthIndex)) {
      return sum + payment.online;
    }
    return sum;
  }, 0);

  const cashPaidAmount = students.reduce((sum, s) => {
    const payment = paymentSummary(s);
    if (filterType === "all" || matchDate(s.lastPaymentDate, targetYear, targetMonthIndex)) {
      return sum + payment.cash;
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-slate-900">Hostel Students</h1>

      {/* ================= METRIC HIGHLIGHT CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="stat-card motion-rise" data-tone="ember">
          <h2 className="stat-label">Students Displayed</h2>
          <p className="stat-value">{filteredStudents.length} Profiles</p>
        </div>
        <div className="stat-card motion-rise" data-tone="blue">
          <h2 className="stat-label">Collected Online</h2>
          <p className="stat-value">₹{onlinePaidAmount}</p>
        </div>
        <div className="stat-card motion-rise" data-tone="amber">
          <h2 className="stat-label">Collected Cash</h2>
          <p className="stat-value">₹{cashPaidAmount}</p>
        </div>
        <div className="stat-card motion-rise" data-tone="forest">
          <h2 className="stat-label">Total Revenue</h2>
          <p className="stat-value">₹{filteredPaidAmount}</p>
        </div>
        <div className="stat-card motion-rise" data-tone="rose">
          <h2 className="stat-label">Total Outstanding</h2>
          <p className="stat-value">₹{filteredPendingAmount}</p>
        </div>
      </div>

      {/* ================= COMPREHENSIVE REGISTRATION FORM ================= */}
      <div className="panel p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          className="border p-2 rounded text-sm"
          placeholder="Student Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="border p-2 rounded text-sm"
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className="border p-2 rounded text-sm"
          placeholder="Assigned Room No"
          value={form.roomNo}
          onChange={(e) => setForm({ ...form, roomNo: e.target.value })}
        />
        
        <select
          className="border p-2 rounded text-sm bg-white"
          value={form.sharingType}
          onChange={(e) => setForm({ ...form, sharingType: e.target.value })}
        >
          <option value="Single">Single Sharing</option>
          <option value="Double Sharing">Double Sharing</option>
        </select>

        {isSplitPayment ? (
          <>
            <input
              type="number"
              min="0"
              className="border p-2 rounded text-sm"
              placeholder="Amount Paid Online (₹)"
              value={form.amountPaidOnline}
              onChange={(e) => setForm({ ...form, amountPaidOnline: e.target.value })}
            />
            <input
              type="number"
              min="0"
              className="border p-2 rounded text-sm"
              placeholder="Amount Paid Cash (₹)"
              value={form.amountPaidCash}
              onChange={(e) => setForm({ ...form, amountPaidCash: e.target.value })}
            />
          </>
        ) : (
          <input
            type="number"
            min="0"
            className="border p-2 rounded text-sm"
            placeholder="Amount Paid (₹)"
            value={form.amountPaid}
            onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
          />
        )}
        <input
          type="number"
          min="0"
          className="border p-2 rounded text-sm"
          placeholder="Amount Due (₹)"
          value={form.amountDue}
          onChange={(e) => {
            const dueVal = e.target.value;
            const numericalDue = Number(dueVal) || 0;
            setForm({ 
              ...form, 
              amountDue: dueVal,
              feeStatus: numericalDue > 0 ? "Pending" : "Paid"
            });
          }}
        />

        <select
          className="border p-2 rounded text-sm bg-white"
          value={form.paymentMode}
          onChange={(e) => setForm({
            ...form,
            paymentMode: e.target.value,
            amountPaid: e.target.value === "Split" ? "" : form.amountPaid,
            amountPaidOnline: e.target.value === "Split" ? form.amountPaidOnline : "",
            amountPaidCash: e.target.value === "Split" ? form.amountPaidCash : "",
          })}
        >
          <option value="Online">Online Transaction</option>
          <option value="Cash">Cash Handover</option>
          <option value="Split">Split Payment</option>
        </select>

        <div className="flex items-center space-x-2 border p-2 rounded bg-gray-50/50">
          <input
            type="checkbox"
            id="advancePayment"
            className="w-4 h-4 accent-orange-600 rounded"
            checked={form.isAdvancePayment}
            onChange={(e) => setForm({ ...form, isAdvancePayment: e.target.checked })}
          />
          <label htmlFor="advancePayment" className="text-xs font-semibold text-gray-600 select-none cursor-pointer">
            Is Advance Payment?
          </label>
        </div>

        <input
          type="number"
          min="0"
          className="border p-2 rounded text-sm"
          placeholder="Advance Top-up (₹)"
          value={form.advanceAmount}
          onChange={(e) => setForm({ ...form, advanceAmount: e.target.value })}
        />
        <div className="text-xs text-gray-500 col-span-full mt-1">Advance will be saved to student's wallet and visible in the Advance modal.</div>

        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-0.5">Date of Joining</label>
          <input
            className="border p-2 text-sm w-full rounded"
            type="date"
            value={form.dateOfJoining}
            onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-0.5">Last Payment Date</label>
          <input
            className="border p-2 text-sm w-full rounded"
            type="date"
            value={form.lastPaymentDate}
            onChange={(e) => setForm({ ...form, lastPaymentDate: e.target.value })}
          />
        </div>

        <div className="flex flex-col justify-end col-span-1 md:col-span-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-0.5">Identity Proof (PDF Doc)</label>
          <input
            id="identityProofInput"
            className="border p-1.5 text-sm w-full rounded bg-white file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-100 hover:file:bg-gray-200 cursor-pointer"
            type="file"
            accept="application/pdf"
            onChange={(e) => setSelectedFile(e.target.files[0] || null)} // 🆕 Binds full binary instance instead of name string
          />
        </div>

        <div className="col-span-full text-xs font-semibold px-1 py-0.5 text-gray-500">
        {/* Corrected line */}
Calculated Fee Status: <span className={form.feeStatus === "Paid" ? "text-green-600 font-bold" : "text-red-500 font-bold"}>{form.feeStatus}</span>
        </div>

        <button
          onClick={addStudent}
          className="btn-primary col-span-full"
        >
          Register Hostel Resident
        </button>
      </div>

      {/* ================= INTERACTIVE PERIOD CONTROLLER BAR ================= */}
      <div className="panel-soft p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm text-gray-700">Filter Period:</span>
            <select
              className="border p-1.5 rounded text-sm bg-white font-medium"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Show All Records</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Select Specific Month</option>
            </select>
          </div>

          {filterType !== "all" && (
            <div className="flex items-center space-x-2 border-l pl-4 border-gray-300">
              <span className="font-semibold text-sm text-gray-700">Filter List By:</span>
              <select
                className="border p-1.5 rounded text-sm bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                value={filterCriteria}
                onChange={(e) => setFilterCriteria(e.target.value)}
              >
                <option value="joining">Date of Joining</option>
                <option value="payment">Last Payment Date</option>
              </select>
            </div>
          )}
        </div>

        {filterType === "custom" && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Choose Target Month:</span>
            <input
              type="month"
              className="border p-1 rounded text-sm bg-white"
              value={customMonth}
              onChange={(e) => setCustomMonth(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* ================= COMPACT REGISTRAR DATA TABLE ================= */}
      <div className="table-shell">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-3">Resident</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Room / Config</th>
              <th className="p-3">Paid</th>
              <th className="p-3">Due</th>
              <th className="p-3">Advance (₹)</th>
              <th className="p-3">Method</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y">
            {filteredStudents.map((s) => (
              <tr key={s._id} className="hover:bg-gray-50/50 transition">
                <td className="p-3 font-medium text-gray-800">{s.name}</td>
                <td className="p-3 text-gray-600">{s.phone}</td>
                <td className="p-3">
                  <div className="font-semibold text-gray-700">Room #{s.roomNo}</div>
                  <div className="text-[11px] text-gray-400 font-medium">{s.sharingType || "Single"}</div>
                </td>
                <td className="p-3 text-green-600 font-medium">₹{paymentSummary(s).total}</td>
                <td className="p-3 text-red-500 font-medium">₹{s.amountDue || 0}</td>
                <td className="p-3 text-blue-700 font-semibold">₹{s.advanceAmount || 0}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${String(s.paymentMode || "").toLowerCase() === 'cash' ? 'bg-amber-50 text-amber-700 border border-amber-100' : String(s.paymentMode || "").toLowerCase() === 'split' ? 'bg-violet-50 text-violet-700 border border-violet-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                    {s.paymentMode || "Online"}
                  </span>
                </td>
                <td className="p-3">
                  {s.isAdvancePayment ? (
                    <span className="bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded text-xs font-bold">Advance</span>
                  ) : (
                    <span className="text-gray-400 text-xs">Standard</span>
                  )}
                </td>
                <td className="p-3">
                  <span className={s.feeStatus === "Paid" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                    {s.feeStatus}
                  </span>
                </td>
                <td className="p-3 text-center space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => handleEditClick(s)}
                    className="btn-primary text-xs px-3 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setAdvanceOpenFor(s)}
                    className="btn-ghost text-xs px-3 py-1"
                  >
                    Advance
                  </button>
                  <button
                    onClick={() => deleteStudent(s._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center p-8 text-gray-400 font-medium bg-gray-50/50">
                  No hostel residents match this criteria for the selected window.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= EDIT MODAL COMPONENT ================= */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-xs">
          <div className="bg-white p-6 w-96 max-h-[90vh] overflow-y-auto space-y-3 rounded-lg shadow-xl border">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Edit Resident Profile</h2>
            
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Name</label>
              <input className="border p-2 w-full rounded text-sm" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Phone</label>
              <input className="border p-2 w-full rounded text-sm" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Room No</label>
              <input className="border p-2 w-full rounded text-sm" value={editForm.roomNo} onChange={(e) => setEditForm({ ...editForm, roomNo: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Sharing Type</label>
              <select className="border p-2 w-full rounded text-sm bg-white" value={editForm.sharingType} onChange={(e) => setEditForm({ ...editForm, sharingType: e.target.value })} >
                <option value="Single">Single</option>
                <option value="Double Sharing">Double Sharing</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Paid (₹)</label>
                {editForm.paymentMode === "Split" ? (
                  <div className="space-y-2">
                    <input className="border p-2 w-full rounded text-sm" type="number" min="0" value={editForm.amountPaidOnline} onChange={(e) => setEditForm({ ...editForm, amountPaidOnline: e.target.value })} placeholder="Online amount" />
                    <input className="border p-2 w-full rounded text-sm" type="number" min="0" value={editForm.amountPaidCash} onChange={(e) => setEditForm({ ...editForm, amountPaidCash: e.target.value })} placeholder="Cash amount" />
                  </div>
                ) : (
                  <input className="border p-2 w-full rounded text-sm" type="number" min="0" value={editForm.amountPaid} onChange={(e) => setEditForm({ ...editForm, amountPaid: e.target.value })} />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Due (₹)</label>
                <input 
                  className="border p-2 w-full rounded text-sm" 
                  type="number" 
                  min="0"
                  value={editForm.amountDue} 
                  onChange={(e) => {
                    const dueVal = e.target.value;
                    const numericalDue = Number(dueVal) || 0;
                    setEditForm({ 
                      ...editForm, 
                      amountDue: dueVal,
                      feeStatus: numericalDue > 0 ? "Pending" : "Paid"
                    });
                  }} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Payment Received Now (₹)</label>
                {editForm.paymentReceivedMode === "Split" ? (
                  <div className="space-y-2">
                    <input className="border p-2 w-full rounded text-sm" type="number" min="0" value={editForm.paymentReceivedOnlineNow} onChange={(e) => setEditForm({ ...editForm, paymentReceivedOnlineNow: e.target.value })} placeholder="Online amount" />
                    <input className="border p-2 w-full rounded text-sm" type="number" min="0" value={editForm.paymentReceivedCashNow} onChange={(e) => setEditForm({ ...editForm, paymentReceivedCashNow: e.target.value })} placeholder="Cash amount" />
                  </div>
                ) : (
                  <input className="border p-2 w-full rounded text-sm" type="number" min="0" value={editForm.paymentReceivedNow} onChange={(e) => setEditForm({ ...editForm, paymentReceivedNow: e.target.value })} placeholder="0" />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Current Payment Mode</label>
                <select className="border p-2 w-full rounded text-sm bg-white" value={editForm.paymentReceivedMode} onChange={(e) => setEditForm({
                  ...editForm,
                  paymentReceivedMode: e.target.value,
                  paymentReceivedNow: e.target.value === "Split" ? "" : editForm.paymentReceivedNow,
                  paymentReceivedOnlineNow: e.target.value === "Split" ? editForm.paymentReceivedOnlineNow : "",
                  paymentReceivedCashNow: e.target.value === "Split" ? editForm.paymentReceivedCashNow : ""
                })}>
                  <option value="Online">Online</option>
                  <option value="Cash">Cash</option>
                  <option value="Split">Split</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Payment Mode</label>
              <select className="border p-2 w-full rounded text-sm bg-white" value={editForm.paymentMode} onChange={(e) => setEditForm({
                ...editForm,
                paymentMode: e.target.value,
                amountPaid: e.target.value === "Split" ? editForm.amountPaid : editForm.amountPaid,
                amountPaidOnline: e.target.value === "Split" ? editForm.amountPaidOnline : "",
                amountPaidCash: e.target.value === "Split" ? editForm.amountPaidCash : ""
              })} >
                <option value="Online">Online</option>
                <option value="Cash">Cash</option>
                <option value="Split">Split</option>
              </select>
            </div>

            {editForm.paymentMode === "Split" && (
              <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-orange-700">Split Payment Summary</div>
                <div className="mt-1 text-orange-900 font-medium">
                  Online: ₹{editPaymentSummary(editForm).online} · Cash: ₹{editPaymentSummary(editForm).cash} · Total: ₹{editPaymentSummary(editForm).total}
                </div>
              </div>
            )}

            {(Number(editForm.paymentReceivedNow) > 0 || Number(editForm.paymentReceivedOnlineNow) > 0 || Number(editForm.paymentReceivedCashNow) > 0) && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                The amount entered in “Payment Received Now” will be added to the student’s total paid amount and deducted from the current due automatically.
              </div>
            )}

            <div className="flex items-center space-x-2 border p-2 rounded bg-gray-50/50 my-1">
              <input
                type="checkbox"
                id="editAdvance"
                className="w-4 h-4 accent-orange-600 rounded"
                checked={editForm.isAdvancePayment}
                onChange={(e) => setEditForm({ ...editForm, isAdvancePayment: e.target.checked })}
              />
              <label htmlFor="editAdvance" className="text-xs font-bold text-gray-600 select-none cursor-pointer">
                Advance Payment Settled
              </label>
            </div>

            <div className="mt-2 p-2 border rounded bg-gray-50 text-sm">
              <div className="text-xs font-semibold text-gray-600">Advance Balance</div>
              <div className="font-medium text-blue-700">₹{editingStudent?.advanceAmount || 0}</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="number"
                    min="0"
                  className="border p-2 w-full rounded text-sm"
                  placeholder="Top-up advance (₹)"
                  value={editForm.advanceTopUp}
                  onChange={(e) => setEditForm({ ...editForm, advanceTopUp: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  <input id="useAdvanceNow" type="checkbox" checked={editForm.useAdvance} onChange={(e) => setEditForm({ ...editForm, useAdvance: e.target.checked })} />
                  <label htmlFor="useAdvanceNow" className="text-xs text-gray-600">Use advance to clear due</label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Date of Joining</label>
              <input className="border p-2 w-full rounded text-sm" type="date" value={editForm.dateOfJoining} onChange={(e) => setEditForm({ ...editForm, dateOfJoining: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Last Payment Date</label>
              <input className="border p-2 w-full rounded text-sm" type="date" value={editForm.lastPaymentDate} onChange={(e) => setEditForm({ ...editForm, lastPaymentDate: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Fee Status</label>
              <span className={`text-sm font-bold ${editForm.feeStatus === 'Paid' ? 'text-green-600' : 'text-red-500'}`}>
                {editForm.feeStatus}
              </span>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t text-sm font-medium">
              <button type="button" onClick={() => setEditingStudent(null)} className="btn-ghost">Cancel</button>
              <button type="button" onClick={updateStudent} className="btn-primary">Update Profile</button>
            </div>
          </div>
        </div>
      )}
      {advanceOpenFor && (
        <AdvanceModal
          open={Boolean(advanceOpenFor)}
          onClose={() => setAdvanceOpenFor(null)}
          studentId={advanceOpenFor?._id}
          basePath="students"
          onUpdated={fetchStudents}
          studentName={advanceOpenFor?.name}
        />
      )}
    </div>
  );
}