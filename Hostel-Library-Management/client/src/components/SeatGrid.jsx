import axios from "axios";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

const SeatGrid = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGridOpen, setIsGridOpen] = useState(false);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  
  // Updated form state to match the complete library structure
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    studentType: "Hosteler",
    seatNo: "",
    feeStatus: "Pending",
    amountPaid: "",
    amountDue: "",
    lastPaymentDate: "",
    dateOfJoining: "",
    paymentMode: "Online" 
  });
  
  // Tracks the physical binary file upload object cleanly
  const [fileObject, setFileObject] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const isEditing = Boolean(editingStudent);

  const formatDateForInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  const formatDateDisplay = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-IN");
  };

  const formatCurrency = (value) => `₹${Number(value) || 0}`;

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/library`);
      setStudents(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching library data:", err);
      setError("Could not connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const getOccupyingStudent = (seatNo) => {
    if (!students || !Array.isArray(students)) return null;
    return students.find(
      (s) => Number(s.seatNo) === Number(seatNo) || String(s.seatNo) === String(seatNo)
    );
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setFileObject(null);
  };

  const openCreateModal = (seatNo) => {
    setSelectedSeat(seatNo);
    setEditingStudent(null);
    setFileObject(null);

    setFormData({
      name: "",
      phone: "",
      studentType: "Hosteler",
      seatNo: String(seatNo),
      feeStatus: "Pending",
      amountPaid: "",
      amountDue: "",
      lastPaymentDate: "",
      dateOfJoining: "",
      paymentMode: "Online"
    });

    setIsModalOpen(true);
  };

  const openEditModal = (seatNo, student) => {
    setSelectedSeat(seatNo);
    setEditingStudent(student);
    setFileObject(null);

    setFormData({
      name: student.name || "",
      phone: student.phone || "",
      studentType: student.studentType || "Hosteler",
      seatNo: String(seatNo),
      feeStatus: student.feeStatus || "Pending",
      amountPaid: student.amountPaid ?? "",
      amountDue: student.amountDue ?? "",
      lastPaymentDate: formatDateForInput(student.lastPaymentDate),
      dateOfJoining: formatDateForInput(student.dateOfJoining),
      paymentMode: student.paymentMode || "Online"
    });

    setIsModalOpen(true);
  };

  const handleClick = (seatNo) => {
    const student = getOccupyingStudent(seatNo);
    if (student) {
      openEditModal(seatNo, student);
    } else {
      openCreateModal(seatNo);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const parsedAmountPaid = Number(formData.amountPaid) || 0;
      const parsedAmountDue = Number(formData.amountDue) || 0;
      const calculatedFeeStatus = parsedAmountDue > 0 ? "Pending" : "Paid";

      if (isEditing && editingStudent?._id) {
        const payload = {
          ...formData,
          seatNo: String(selectedSeat),
          amountPaid: parsedAmountPaid,
          amountDue: parsedAmountDue,
          feeStatus: calculatedFeeStatus
        };

        await axios.put(`${API_BASE_URL}/api/library/${editingStudent._id}`, payload);
        closeModal();
        await fetchStudents();
        alert(`Seat ${selectedSeat} has been updated.`);
        return;
      }

      const dataPayload = new FormData();
      dataPayload.append("name", formData.name);
      dataPayload.append("phone", formData.phone);
      dataPayload.append("studentType", formData.studentType);
      dataPayload.append("seatNo", String(selectedSeat));
      dataPayload.append("amountPaid", parsedAmountPaid);
      dataPayload.append("amountDue", parsedAmountDue);
      dataPayload.append("feeStatus", calculatedFeeStatus);
      dataPayload.append("lastPaymentDate", formData.lastPaymentDate);
      dataPayload.append("dateOfJoining", formData.dateOfJoining);
      dataPayload.append("paymentMode", formData.paymentMode);

      if (fileObject) {
        dataPayload.append("identityProof", fileObject);
      }

      await axios.post(`${API_BASE_URL}/api/library/add`, dataPayload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      closeModal();
      await fetchStudents();
      alert(`Success! Seat ${selectedSeat} has been allocated to ${formData.name}.`);
    } catch (err) {
      console.error("Error allocating seat:", err);
      alert("Failed to assign seat. Check backend logs.");
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) return <div className="text-gray-500 font-semibold p-4">⏳ Loading seat map...</div>;

  const allocatedSeats = [...students]
    .filter((student) => String(student.seatNo || "").trim() !== "")
    .sort((a, b) => {
      const aNum = Number(a.seatNo);
      const bNum = Number(b.seatNo);

      if (Number.isNaN(aNum) || Number.isNaN(bNum)) {
        return String(a.seatNo || "").localeCompare(String(b.seatNo || ""));
      }

      return aNum - bNum;
    });

  const totalSeats = 41;
  const seatNumbers = Array.from({ length: totalSeats }, (_, i) => i + 1);
  const occupiedCount = allocatedSeats.length;
  const availableCount = Math.max(totalSeats - occupiedCount, 0);

  return (
    <div className="panel-soft p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Library Seat Matrix</h2>
          <p className="text-sm text-gray-500 mt-1">Live overview of library desk occupancy</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStudents}
            className="btn-ghost text-xs"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsGridOpen((prev) => !prev)}
            className="btn-primary btn-primary-sm"
            aria-expanded={isGridOpen}
          >
            {isGridOpen ? "Hide Grid" : "Show Grid"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
          ⚠️ {error}
        </div>
      )}

      <div className="seat-grid-meta-bar">
        <span className="seat-grid-chip">Total Seats: {totalSeats}</span>
        <span className="seat-grid-chip" data-tone="occupied">Occupied: {occupiedCount}</span>
        <span className="seat-grid-chip" data-tone="available">Available: {availableCount}</span>
      </div>

      {isGridOpen ? (
        <>
          {/* Grid Display */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-w-md mx-auto justify-items-center">
            {seatNumbers.map((seat) => {
              const student = getOccupyingStudent(seat);
              const isOccupied = !!student;

              return (
                <button
                  key={seat}
                  onClick={() => handleClick(seat)}
                  className={`seat-tile ${isOccupied ? "seat-tile-occupied" : "seat-tile-available"}`}
                >
                  <span className="text-sm">#{seat}</span>
                  {isOccupied && <span className="text-[9px] font-normal tracking-wide uppercase opacity-90 mt-0.5">Busy</span>}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 justify-center mt-6 pt-4 border-t border-gray-100 text-xs font-medium text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-teal-500 rounded-full inline-block"></span>
              <span>Available (Click to Assign)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-rose-500 rounded-full inline-block"></span>
              <span>Occupied ({occupiedCount})</span>
            </div>
          </div>
        </>
      ) : (
        <div className="seat-grid-placeholder">
          Seat grid is hidden. Click "Show Grid" to view and assign seats.
        </div>
      )}

      {/* Allocated Seats List */}
      <div className="mt-8 table-shell">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-800">Allocated Seats</h3>
            <p className="text-xs text-gray-500">All occupied seats with student details.</p>
          </div>
          <span className="text-xs font-semibold text-gray-500">{allocatedSeats.length} Records</span>
        </div>

        {allocatedSeats.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No seats have been allocated yet.</div>
        ) : (
          <div className="payment-list">
            {allocatedSeats.map((student) => {
              const amountPaid = Number(student.amountPaid) || 0;
              const amountDue = Number(student.amountDue) || 0;
              const totalAmount = amountPaid + amountDue;
              const feeStatus = student.feeStatus || (amountDue > 0 ? "Pending" : "Paid");
              const statusTone = feeStatus === "Paid" ? "paid" : "pending";
              const paidPercent = totalAmount > 0
                ? Math.round((amountPaid / totalAmount) * 100)
                : (feeStatus === "Paid" ? 100 : 0);

              return (
                <div key={student._id || student.seatNo} className="payment-card">
                  <div className="payment-card-main">
                    <span className="payment-seat">Seat #{student.seatNo}</span>
                    <div className="payment-name">{student.name || "Unknown"}</div>
                    <div className="payment-meta">
                      <span>{student.phone || "N/A"}</span>
                      <span>{student.studentType || "Hosteler"}</span>
                      <span>Joined {formatDateDisplay(student.dateOfJoining)}</span>
                    </div>
                    <div className="payment-chips">
                      <span className="payment-chip" data-tone={statusTone}>{feeStatus}</span>
                      <span className="payment-chip" data-tone="info">{student.paymentMode || "Online"}</span>
                      <span className="payment-chip" data-tone="muted">
                        {student.identityProof ? "ID Proof" : "No ID Proof"}
                      </span>
                    </div>
                  </div>
                  <div className="payment-card-metrics">
                    <div className="payment-amount">
                      <span className="label">Paid</span>
                      <span className="value is-positive">{formatCurrency(amountPaid)}</span>
                    </div>
                    <div className="payment-amount">
                      <span className="label">Due</span>
                      <span className="value is-negative">{formatCurrency(amountDue)}</span>
                    </div>
                    <div className="payment-amount">
                      <span className="label">Last Payment</span>
                      <span className="value">{formatDateDisplay(student.lastPaymentDate)}</span>
                    </div>
                    <div className="payment-progress" data-tone={statusTone}>
                      <span style={{ width: `${paidPercent}%` }} />
                    </div>
                    <div className="payment-percent">{paidPercent}% settled</div>
                  </div>
                  <div className="payment-card-actions">
                    {student.identityProof ? (
                      <a
                        href={`${API_BASE_URL}/uploads/${student.identityProof}`}
                        target="_blank"
                        rel="noreferrer"
                        className="payment-link"
                      >
                        View ID Proof
                      </a>
                    ) : (
                      <span className="payment-link muted">No ID Proof</span>
                    )}
                    <button
                      onClick={() => openEditModal(student.seatNo, student)}
                      className="btn-primary btn-primary-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- ALLOCATION MODAL POPUP --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl border border-gray-100 m-4 max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {isEditing ? "✏️ Editing" : "🪑 Allocating"} <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-sm border border-emerald-100">Seat #{selectedSeat}</span>
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl font-medium">&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Student Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  value={formData.name} 
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    required 
                    value={formData.phone} 
                    onChange={handleInputChange}
                    placeholder="Mobile number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Date of Joining</label>
                  <input 
                    type="date" 
                    name="dateOfJoining"
                    required
                    value={formData.dateOfJoining} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Seat Number</label>
                  <input type="text" disabled value={`#${selectedSeat}`} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500 font-bold cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Student Type</label>
                  <select name="studentType" value={formData.studentType} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition">
                    <option value="Hosteler">Hosteler</option>
                    <option value="Day Scholar">Day Scholar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Amount Paid (₹)</label>
                  <input 
                    type="number" 
                    name="amountPaid" 
                    value={formData.amountPaid} 
                    onChange={handleInputChange}
                    placeholder="Amount"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Amount Due (₹)</label>
                  <input 
                    type="number" 
                    name="amountDue" 
                    value={formData.amountDue} 
                    placeholder="Due parameters"
                    onChange={(e) => {
                      const value = e.target.value;
                      const numericDue = Number(value) || 0;
                      setFormData(prev => ({
                        ...prev,
                        amountDue: value,
                        feeStatus: numericDue > 0 ? "Pending" : "Paid"
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Payment Mode</label>
                  <select name="paymentMode" value={formData.paymentMode} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition">
                    <option value="Online">Online Payment</option>
                    <option value="Cash">Cash Payment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Last Payment Date</label>
                  <input 
                    type="date" 
                    name="lastPaymentDate"
                    value={formData.lastPaymentDate} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Identity Proof (PDF Document)</label>
                {isEditing ? (
                  <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    File updates are available from the Library page.
                  </div>
                ) : (
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => setFileObject(e.target.files[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 file:cursor-pointer hover:file:bg-gray-100"
                  />
                )}
              </div>

              <div className="text-xs font-semibold text-gray-400 px-0.5">
                Auto-Assigned Status: <span className={formData.feeStatus === "Paid" ? "text-green-600 font-bold" : "text-red-500 font-bold"}>{formData.feeStatus}</span>
              </div>

              <div className="flex gap-3 pt-3 justify-end text-sm border-t border-gray-100">
                <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={formSubmitting} className={`btn-primary ${formSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}>
                  {formSubmitting ? (isEditing ? "Updating..." : "Allocating...") : (isEditing ? "Update Seat" : "Assign Student")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatGrid;