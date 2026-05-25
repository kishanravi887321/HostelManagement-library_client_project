import axios from "axios";
import { useEffect, useState } from "react";
import AdvanceModal from "../components/AdvanceModal";
import { API_BASE_URL } from "../config/api";

export default function Library() {
  const [students, setStudents] = useState([]);
  
  // Filter States
  const [filterType, setFilterType] = useState("all"); 
  const [filterCriteria, setFilterCriteria] = useState("joining"); // "joining" or "payment"
  const [customMonth, setCustomMonth] = useState("");  

  const [form, setForm] = useState({
    name: "",
    phone: "",
    studentType: "Hosteler",
    seatNo: "",
    feeStatus: "Pending",
    amountPaid: "", 
    amountPaidOnline: "",
    amountPaidCash: "",
    amountDue: "",   
    lastPaymentDate: "",
    dateOfJoining: "",
    paymentMode: "Online",
    advanceAmount: ""
  });
  
  // Track the actual binary file object
  const [fileObject, setFileObject] = useState(null);

  const [editingStudent, setEditingStudent] = useState(null);
  const [advanceOpenFor, setAdvanceOpenFor] = useState(null);

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    identityProof: "",
    studentType: "Hosteler",
    seatNo: "",
    feeStatus: "Pending",
    amountPaid: "",
    amountPaidOnline: "",
    amountPaidCash: "",
    amountDue: "",
    paymentReceivedNow: "",
    paymentReceivedOnlineNow: "",
    paymentReceivedCashNow: "",
    paymentReceivedMode: "Online",
    lastPaymentDate: "",
    dateOfJoining: "",
    paymentMode: "Online",
    advanceTopUp: "",
    useAdvance: false,
    advanceAmount: ""
  });

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

  const editPaymentSummary = () => paymentSummary(editForm);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/library`);
      setStudents(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchStudents();
    };
    init();
  }, []);

  // 🆕 UPGRADED: Sends the actual file via FormData payload
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
      formData.append("studentType", form.studentType);
      formData.append("seatNo", form.seatNo);
      formData.append("amountPaid", amountPaidTotal);
      formData.append("amountPaidOnline", isSplitPayment ? Number(form.amountPaidOnline) || 0 : 0);
      formData.append("amountPaidCash", isSplitPayment ? Number(form.amountPaidCash) || 0 : 0);
      formData.append("amountDue", parsedAmountDue);
      formData.append("feeStatus", calculatedFeeStatus);
      formData.append("lastPaymentDate", form.lastPaymentDate);
      formData.append("dateOfJoining", form.dateOfJoining);
      formData.append("paymentMode", form.paymentMode);
      formData.append("advanceAmount", Number(form.advanceAmount) || 0);
      formData.append("paymentReceivedNow", Number(form.amountPaid) || 0);
      formData.append("paymentReceivedOnlineNow", isSplitPayment ? Number(form.amountPaidOnline) || 0 : (form.paymentMode === "Online" ? Number(form.amountPaid) || 0 : 0));
      formData.append("paymentReceivedCashNow", isSplitPayment ? Number(form.amountPaidCash) || 0 : (form.paymentMode === "Cash" ? Number(form.amountPaid) || 0 : 0));
      
      if (fileObject) {
        // "identityProof" must match the name your multer backend middleware expects
        formData.append("identityProof", fileObject);
      }

      await axios.post(`${API_BASE_URL}/api/library/add`, formData);

      setForm({
        name: "",
        phone: "",
        studentType: "Hosteler",
        seatNo: "",
        feeStatus: "Pending",
        amountPaid: "",
        amountPaidOnline: "",
        amountPaidCash: "",
        amountDue: "",
        lastPaymentDate: "",
        dateOfJoining: "",
        paymentMode: "Online",
        advanceAmount: ""
      });
      setFileObject(null); // Reset file upload input stream

      fetchStudents();
    } catch (err) {
      console.log(err);
    }
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name || "",
      phone: student.phone || "",
      identityProof: student.identityProof || "",
      studentType: student.studentType || "Hosteler",
      seatNo: student.seatNo || "",
      feeStatus: student.feeStatus || "Pending",
      amountPaid: student.amountPaid !== undefined ? student.amountPaid : "",
      amountPaidOnline: student.amountPaidOnline !== undefined ? student.amountPaidOnline : "",
      amountPaidCash: student.amountPaidCash !== undefined ? student.amountPaidCash : "",
      amountDue: student.amountDue !== undefined ? student.amountDue : "",
      paymentReceivedNow: "",
      paymentReceivedOnlineNow: "",
      paymentReceivedCashNow: "",
      paymentReceivedMode: student.paymentMode || "Online",
      lastPaymentDate: student.lastPaymentDate || "",
      dateOfJoining: student.dateOfJoining || "",
      paymentMode: student.paymentMode || "Online",
      advanceTopUp: "",
      useAdvance: false,
      advanceAmount: student.advanceAmount ?? ""
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

      await axios.put(`${API_BASE_URL}/api/library/${editingStudent._id}`, payload);
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

    if (filterType === "thisMonth") {
      targetMonthIndex = now.getMonth();
      targetYear = now.getFullYear();
    } else if (filterType === "lastMonth") {
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

  const totalStudentsCount = filteredStudents.length;

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
      <h1 className="text-3xl font-semibold text-slate-900">Library Management</h1>

      {/* ================= FILTER SUMS VISUALIZER CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="stat-card motion-rise" data-tone="teal">
          <h2 className="stat-label">Students Displayed</h2>
          <p className="stat-value">{totalStudentsCount} Profiles</p>
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
          <h2 className="stat-label">Total Collected</h2>
          <p className="stat-value">₹{filteredPaidAmount}</p>
        </div>
        <div className="stat-card motion-rise" data-tone="rose">
          <h2 className="stat-label">Pending Amount</h2>
          <p className="stat-value">₹{filteredPendingAmount}</p>
        </div>
      </div>

      {/* ================= ADD NEW STUDENT FORM ================= */}
      <div className="panel p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          className="border p-2 rounded text-sm"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="border p-2 rounded text-sm"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className="border p-2 rounded text-sm"
          placeholder="Seat No"
          value={form.seatNo}
          onChange={(e) => setForm({ ...form, seatNo: e.target.value })}
        />
        <select
          className="border p-2 rounded text-sm"
          value={form.studentType}
          onChange={(e) => setForm({ ...form, studentType: e.target.value })}
        >
          <option value="Hosteler">Hosteler</option>
          <option value="Day Scholar">Day Scholar</option>
        </select>
        {isSplitPayment ? (
          <>
            <input
              type="number"
              min="0"
              className="border p-2 rounded text-sm"
              placeholder="Amount Paid Online"
              value={form.amountPaidOnline}
              onChange={(e) => setForm({ ...form, amountPaidOnline: e.target.value })}
            />
            <input
              type="number"
              min="0"
              className="border p-2 rounded text-sm"
              placeholder="Amount Paid Cash"
              value={form.amountPaidCash}
              onChange={(e) => setForm({ ...form, amountPaidCash: e.target.value })}
            />
          </>
        ) : (
          <input
            type="number"
            min="0"
            className="border p-2 rounded text-sm"
            placeholder="Amount Paid"
            value={form.amountPaid}
            onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
          />
        )}

        <input
          type="number"
          min="0"
          className="border p-2 rounded text-sm"
          placeholder="Amount Due"
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
        <input
          type="number"
          min="0"
          className="border p-2 rounded text-sm"
          placeholder="Advance Top-up (₹)"
          value={form.advanceAmount}
          onChange={(e) => setForm({ ...form, advanceAmount: e.target.value })}
        />

        <select
          className="border p-2 rounded text-sm"
          value={form.paymentMode}
          onChange={(e) => setForm({
            ...form,
            paymentMode: e.target.value,
            amountPaid: e.target.value === "Split" ? "" : form.amountPaid,
            amountPaidOnline: e.target.value === "Split" ? form.amountPaidOnline : "",
            amountPaidCash: e.target.value === "Split" ? form.amountPaidCash : "",
          })}
        >
          <option value="Online">Online Payment</option>
          <option value="Cash">Cash Payment</option>
          <option value="Split">Split Payment</option>
        </select>
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-0.5">Last Payment Date</label>
          <input
            className="border p-2 text-sm w-full rounded"
            type="date"
            value={form.lastPaymentDate}
            onChange={(e) => setForm({ ...form, lastPaymentDate: e.target.value })}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-0.5">Date of Joining</label>
          <input
            className="border p-2 text-sm w-full rounded"
            type="date"
            value={form.dateOfJoining}
            onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })}
          />
        </div>
        <div className="flex flex-col justify-end col-span-1 md:col-span-2">
          {/* 🆕 Fixed File Input to handle binary tracking */}
          <input
            className="border p-2 text-sm w-full rounded"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFileObject(e.target.files[0] || null)}
          />
        </div>

        <div className="col-span-full text-xs font-semibold px-1 text-gray-400">
          Auto-Assigned Status: <span className={form.feeStatus === "Paid" ? "text-green-600 font-bold" : "text-red-500 font-bold"}>{form.feeStatus}</span>
        </div>

        <button
          onClick={addStudent}
          className="btn-primary col-span-full"
        >
          Add Student
        </button>
      </div>

      {/* ================= INTERACTIVE MONTH FILTERS CONTROL BAR ================= */}
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
                className="border p-1.5 rounded text-sm bg-green-50 text-green-700 border-green-200 font-semibold"
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
          <div className="flex items-center space-x-2 animate-fade-in">
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

      {/* ================= DATA TABLE VIEW ================= */}
      <div className="table-shell">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Seat</th>
              <th className="p-3">Type</th>
              <th className="p-3">Paid (₹)</th>
              <th className="p-3">Due (₹)</th>
              <th className="p-3">Method</th>
              <th className="p-3">Fee Status</th>
              <th className="p-3">Advance (₹)</th>
              <th className="p-3">ID Proof</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y">
            {filteredStudents.map((s) => (
              <tr key={s._id} className="hover:bg-gray-50/50 transition">
                <td className="p-3 font-medium text-gray-800">{s.name}</td>
                <td className="p-3 text-gray-600">{s.phone}</td>
                <td className="p-3 font-semibold text-gray-700">#{s.seatNo}</td>
                <td className="p-3 text-gray-500">{s.studentType}</td>
                <td className="p-3 text-green-600 font-medium">₹{paymentSummary(s).total}</td>
                <td className="p-3 text-red-500 font-medium">₹{s.amountDue || 0}</td>
                <td className="p-3 text-blue-700 font-semibold">₹{s.advanceAmount || 0}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${String(s.paymentMode || "").toLowerCase() === 'cash' ? 'bg-orange-50 text-orange-600 border' : String(s.paymentMode || "").toLowerCase() === 'split' ? 'bg-violet-50 text-violet-700 border' : 'bg-teal-50 text-teal-700 border'}`}>
                    {s.paymentMode || "Online"}
                  </span>
                </td>
                <td className="p-3">
                  <span className={s.feeStatus === "Paid" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {s.feeStatus}
                  </span>
                </td>
                <td className="p-3">
                  {s.identityProof ? (
                    <a
                      href={`${API_BASE_URL}/uploads/${s.identityProof}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-medium hover:underline text-xs flex items-center gap-1"
                    >
                      📄 View PDF
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs italic">No file</span>
                  )}
                </td>
                <td className="p-3 space-x-2 whitespace-nowrap">
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
                    onClick={async () => {
                      const studentId = s._id || s.id;
                      if (!studentId) return;
                      if (window.confirm("Are you sure you want to permanently delete this student profile?")) {
                        try {
                          await axios.delete(`${API_BASE_URL}/api/library/${studentId}`);
                          alert("Student record removed successfully.");
                          fetchStudents(); 
                        } catch (err) {
                          alert(`Delete failed: ${err.message}`);
                        }
                      }
                    }}
                    className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="10" className="text-center p-8 text-gray-400 font-medium bg-gray-50/50">
                  No library students match this criteria for the selected window.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= EDIT MODAL PANEL ================= */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-xs">
          <div className="bg-white p-6 w-96 max-h-[90vh] overflow-y-auto space-y-3 rounded-lg shadow-xl border">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Edit Student Profile</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Name</label>
              <input className="border p-2 w-full rounded text-sm" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Phone</label>
              <input className="border p-2 w-full rounded text-sm" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Seat No</label>
              <input className="border p-2 w-full rounded text-sm" value={editForm.seatNo} onChange={(e) => setEditForm({ ...editForm, seatNo: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Student Type</label>
              <select className="border p-2 w-full rounded text-sm" value={editForm.studentType} onChange={(e) => setEditForm({ ...editForm, studentType: e.target.value })} >
                <option value="Hosteler">Hosteler</option>
                <option value="Day Scholar">Day Scholar</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Paid (₹)</label>
                <input className="border p-2 w-full rounded text-sm" type="number" min="0" value={editForm.amountPaid} onChange={(e) => setEditForm({ ...editForm, amountPaid: e.target.value })} />
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
                    <input
                      className="border p-2 w-full rounded text-sm"
                      type="number"
                      min="0"
                      value={editForm.paymentReceivedOnlineNow}
                      onChange={(e) => setEditForm({ ...editForm, paymentReceivedOnlineNow: e.target.value })}
                      placeholder="Online amount"
                    />
                    <input
                      className="border p-2 w-full rounded text-sm"
                      type="number"
                      min="0"
                      value={editForm.paymentReceivedCashNow}
                      onChange={(e) => setEditForm({ ...editForm, paymentReceivedCashNow: e.target.value })}
                      placeholder="Cash amount"
                    />
                  </div>
                ) : (
                  <input
                    className="border p-2 w-full rounded text-sm"
                    type="number"
                    min="0"
                    value={editForm.paymentReceivedNow}
                    onChange={(e) => setEditForm({ ...editForm, paymentReceivedNow: e.target.value })}
                    placeholder="0"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Current Payment Mode</label>
                <select
                  className="border p-2 w-full rounded text-sm"
                  value={editForm.paymentReceivedMode}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    paymentReceivedMode: e.target.value,
                    paymentReceivedNow: e.target.value === "Split" ? "" : editForm.paymentReceivedNow,
                    paymentReceivedOnlineNow: e.target.value === "Split" ? editForm.paymentReceivedOnlineNow : "",
                    paymentReceivedCashNow: e.target.value === "Split" ? editForm.paymentReceivedCashNow : ""
                  })}
                >
                  <option value="Online">Online</option>
                  <option value="Cash">Cash</option>
                  <option value="Split">Split</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Payment Mode</label>
              <select
                className="border p-2 w-full rounded text-sm"
                value={editForm.paymentMode}
                onChange={(e) => {
                  const nextMode = e.target.value;
                  setEditForm((prev) => ({
                    ...prev,
                    paymentMode: nextMode,
                    amountPaid: nextMode === "Split" ? prev.amountPaid : prev.amountPaid,
                  }));
                }}
              >
                <option value="Online">Online</option>
                <option value="Cash">Cash</option>
                <option value="Split">Split</option>
              </select>
            </div>
            {editForm.paymentMode === "Split" && (
              <div className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">Split Payment Summary</div>
                <div className="mt-1 text-violet-900 font-medium">
                  Online: ₹{editPaymentSummary().online} · Cash: ₹{editPaymentSummary().cash} · Total: ₹{editPaymentSummary().total}
                </div>
                {editForm.paymentReceivedMode === "Split" ? (
                  Number(editForm.paymentReceivedOnlineNow) > 0 || Number(editForm.paymentReceivedCashNow) > 0 ? (
                    <div className="mt-1 text-violet-800 text-xs">
                      New payment will add ₹{Number(editForm.paymentReceivedOnlineNow) || 0} online and ₹{Number(editForm.paymentReceivedCashNow) || 0} cash, then reduce due automatically.
                    </div>
                  ) : null
                ) : Number(editForm.paymentReceivedNow) > 0 && (
                  <div className="mt-1 text-violet-800 text-xs">
                    New payment will add ₹{Number(editForm.paymentReceivedNow) || 0} to {editForm.paymentReceivedMode} and reduce due automatically.
                  </div>
                )}
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
                    <input id="useAdvance" type="checkbox" checked={editForm.useAdvance} onChange={(e) => setEditForm({ ...editForm, useAdvance: e.target.checked })} />
                    <label htmlFor="useAdvance" className="text-xs text-gray-600">Use advance to clear due</label>
                  </div>
                </div>
              </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Last Payment Date</label>
              <input className="border p-2 w-full rounded text-sm" type="date" value={editForm.lastPaymentDate} onChange={(e) => setEditForm({ ...editForm, lastPaymentDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Date of Joining</label>
              <input className="border p-2 w-full rounded text-sm" type="date" value={editForm.dateOfJoining} onChange={(e) => setEditForm({ ...editForm, dateOfJoining: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Fee Status</label>
              <select 
                className="border p-2 w-full rounded text-sm bg-gray-50 text-gray-700 font-semibold" 
                value={editForm.feeStatus} 
                onChange={(e) => setEditForm({ ...editForm, feeStatus: e.target.value })} 
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t text-sm font-medium">
              <button type="button" onClick={() => setEditingStudent(null)} className="btn-ghost">Cancel</button>
              <button type="button" onClick={updateStudent} className="btn-primary">Update</button>
            </div>
          </div>
        </div>
      )}
      {advanceOpenFor && (
        <AdvanceModal
          open={Boolean(advanceOpenFor)}
          onClose={() => setAdvanceOpenFor(null)}
          studentId={advanceOpenFor?._id}
          basePath="library"
          onUpdated={fetchStudents}
          studentName={advanceOpenFor?.name}
        />
      )}
    </div>
  );
}