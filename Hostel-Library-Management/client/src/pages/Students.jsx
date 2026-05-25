import axios from "axios";
import { useEffect, useState } from "react";
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
    amountDue: "",
    paymentMode: "Online",
    isAdvancePayment: false,
    dateOfJoining: "",
    lastPaymentDate: ""
  });

  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    roomNo: "",
    feeStatus: "Pending",
    sharingType: "Single",
    amountPaid: "",
    amountDue: "",
    paymentMode: "Online",
    isAdvancePayment: false,
    dateOfJoining: "",
    lastPaymentDate: "",
    identityProof: ""
  });

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
      const parsedAmountDue = Number(form.amountDue) || 0;
      const calculatedFeeStatus = parsedAmountDue > 0 ? "Pending" : "Paid";

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("phone", form.phone);
      formData.append("roomNo", form.roomNo);
      formData.append("sharingType", form.sharingType);
      formData.append("amountPaid", Number(form.amountPaid) || 0);
      formData.append("amountDue", parsedAmountDue);
      formData.append("feeStatus", calculatedFeeStatus);
      formData.append("paymentMode", form.paymentMode);
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
        amountDue: "",
        paymentMode: "Online",
        isAdvancePayment: false,
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
      amountDue: student.amountDue !== undefined ? student.amountDue : "",
      paymentMode: student.paymentMode || "Online",
      isAdvancePayment: student.isAdvancePayment || false,
      dateOfJoining: student.dateOfJoining || "",
      lastPaymentDate: student.lastPaymentDate || "",
      identityProof: student.identityProof || ""
    });
  };

  const updateStudent = async () => {
    try {
      const parsedAmountDue = Number(editForm.amountDue) || 0;
      const calculatedFeeStatus = parsedAmountDue > 0 ? "Pending" : "Paid";

      const payload = {
        ...editForm,
        amountPaid: Number(editForm.amountPaid) || 0,
        amountDue: parsedAmountDue,
        feeStatus: calculatedFeeStatus
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
    if (filterType === "all" || matchDate(s.lastPaymentDate, targetYear, targetMonthIndex)) {
      if (String(s.paymentMode || "").toLowerCase() === "online") {
        return sum + (Number(s.amountPaid) || 0);
      }
    }
    return sum;
  }, 0);

  const cashPaidAmount = students.reduce((sum, s) => {
    if (filterType === "all" || matchDate(s.lastPaymentDate, targetYear, targetMonthIndex)) {
      if (String(s.paymentMode || "").toLowerCase() === "cash") {
        return sum + (Number(s.amountPaid) || 0);
      }
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

        <input
          type="number"
          className="border p-2 rounded text-sm"
          placeholder="Amount Paid (₹)"
          value={form.amountPaid}
          onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
        />
        <input
          type="number"
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
          onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
        >
          <option value="Online">Online Transaction</option>
          <option value="Cash">Cash Handover</option>
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
                <td className="p-3 text-green-600 font-medium">₹{s.amountPaid || 0}</td>
                <td className="p-3 text-red-500 font-medium">₹{s.amountDue || 0}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.paymentMode === 'Cash' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
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
                <input className="border p-2 w-full rounded text-sm" type="number" value={editForm.amountPaid} onChange={(e) => setEditForm({ ...editForm, amountPaid: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Due (₹)</label>
                <input 
                  className="border p-2 w-full rounded text-sm" 
                  type="number" 
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

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Payment Mode</label>
              <select className="border p-2 w-full rounded text-sm bg-white" value={editForm.paymentMode} onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })} >
                <option value="Online">Online</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

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
    </div>
  );
}