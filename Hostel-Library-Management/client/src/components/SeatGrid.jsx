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
          <div className="seat-roster">
            <div className="seat-roster-head">
              <span>Seat</span>
              <span>Student</span>
              <span>Contact</span>
              <span>Payment</span>
              <span>Status</span>
              <span className="seat-roster-actions-title">Actions</span>
            </div>
            <div className="seat-roster-body">
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
                  <div key={student._id || student.seatNo} className="seat-roster-row">
                    <div className="seat-roster-seat">
                      <span className="seat-label">Seat</span>
                      <span className="seat-number">#{student.seatNo}</span>
                    </div>
                    <div className="seat-roster-student">
                      <div className="name">{student.name || "Unknown"}</div>
                      <div className="sub">{student.studentType || "Hosteler"}</div>
                    </div>
                    <div className="seat-roster-contact">
                      <span>{student.phone || "N/A"}</span>
                      <span className="sub">Joined {formatDateDisplay(student.dateOfJoining)}</span>
                    </div>
                    <div className="seat-roster-payment">
                      <div className="payment-amounts">
                        <span className="paid">{formatCurrency(amountPaid)}</span>
                        <span className="due">{formatCurrency(amountDue)}</span>
                      </div>
                      <div className="payment-progress" data-tone={statusTone}>
                        <span style={{ width: `${paidPercent}%` }} />
                      </div>
                      <div className="payment-sub">
                        <span className="payment-percent">{paidPercent}% settled</span>
                        <span className="payment-note">Last: {formatDateDisplay(student.lastPaymentDate)}</span>
                      </div>
                    </div>
                    <div className="seat-roster-status">
                      <span className="status-pill" data-tone={statusTone}>{feeStatus}</span>
                      <span className="status-pill" data-tone="info">{student.paymentMode || "Online"}</span>
                      <span className="status-pill" data-tone="muted">
                        {student.identityProof ? "ID Proof" : "No ID"}
                      </span>
                    </div>
                    <div className="seat-roster-actions">
                      {student.identityProof ? (
                        <a
                          href={`${API_BASE_URL}/uploads/${student.identityProof}`}
                          target="_blank"
                          rel="noreferrer"
                          className="seat-roster-link"
                        >
                          View ID Proof
                        </a>
                      ) : (
                        <span className="seat-roster-empty">No ID Proof</span>
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
          </div>
        )}
      </div>

      {/* --- ALLOCATION MODAL POPUP --- */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <div className="modal-title">
                <span className="modal-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
                    <path d="M4 20a8 8 0 0 1 16 0" />
                  </svg>
                </span>
                <div>
                  <h3>{isEditing ? "Edit Seat" : "Allocate Seat"} <span className="modal-seat-chip">Seat #{selectedSeat}</span></h3>
                  <p>Update the seat allocation and student details.</p>
                </div>
              </div>
              <button onClick={closeModal} className="modal-close" aria-label="Close">&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="modal-form">
              <div className="field">
                <label className="field-label">Student Name *</label>
                <div className="field-input">
                  <span className="field-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
                      <path d="M4 20a8 8 0 0 1 16 0" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div className="field-grid">
                <div className="field">
                  <label className="field-label">Phone Number *</label>
                  <div className="field-input">
                    <span className="field-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 20 20 0 0 1-8.7-3.1 19.8 19.8 0 0 1-6.1-6.1A20 20 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8 9a16 16 0 0 0 7 7l.4-.2a2 2 0 0 1 2.1-.5 12.8 12.8 0 0 0 2.8.7 2 2 0 0 1 1.7 1.9Z" />
                      </svg>
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Mobile number"
                    />
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">Date of Joining *</label>
                  <div className="field-input">
                    <span className="field-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                    </span>
                    <input
                      type="date"
                      name="dateOfJoining"
                      required
                      value={formData.dateOfJoining}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="field-grid">
                <div className="field">
                  <label className="field-label">Seat Number *</label>
                  <div className="field-input">
                    <span className="field-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="5" width="16" height="10" rx="2" />
                        <path d="M4 19h16" />
                      </svg>
                    </span>
                    <input type="text" disabled value={`#${selectedSeat}`} />
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">Student Type *</label>
                  <div className="field-input">
                    <span className="field-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
                        <path d="M3 10.5V17l9 4.5 9-4.5v-6.5" />
                      </svg>
                    </span>
                    <select name="studentType" value={formData.studentType} onChange={handleInputChange}>
                      <option value="Hosteler">Hosteler</option>
                      <option value="Day Scholar">Day Scholar</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="field-grid">
                <div className="field">
                  <label className="field-label">Amount Paid (₹) *</label>
                  <div className="field-input">
                    <span className="field-icon" aria-hidden="true">₹</span>
                    <input
                      type="number"
                      name="amountPaid"
                      value={formData.amountPaid}
                      onChange={handleInputChange}
                      placeholder="Amount"
                    />
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">Amount Due (₹) *</label>
                  <div className="field-input">
                    <span className="field-icon" aria-hidden="true">₹</span>
                    <input
                      type="number"
                      name="amountDue"
                      value={formData.amountDue}
                      placeholder="Amount"
                      onChange={(e) => {
                        const value = e.target.value;
                        const numericDue = Number(value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          amountDue: value,
                          feeStatus: numericDue > 0 ? "Pending" : "Paid"
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="field-grid">
                <div className="field">
                  <label className="field-label">Payment Mode *</label>
                  <div className="field-input">
                    <span className="field-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="M3 10h18" />
                      </svg>
                    </span>
                    <select name="paymentMode" value={formData.paymentMode} onChange={handleInputChange}>
                      <option value="Online">Online Payment</option>
                      <option value="Cash">Cash Payment</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">Last Payment Date *</label>
                  <div className="field-input">
                    <span className="field-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                    </span>
                    <input
                      type="date"
                      name="lastPaymentDate"
                      value={formData.lastPaymentDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="field">
                <label className="field-label">Identity Proof (PDF Document)</label>
                {isEditing ? (
                  <div className="upload-box is-disabled">
                    <div className="upload-info">
                      <span className="upload-title">Upload PDF Document</span>
                      <span className="upload-sub">File updates are available from the Library page.</span>
                    </div>
                    <button type="button" className="btn-secondary" disabled>Browse Files</button>
                  </div>
                ) : (
                  <label className="upload-box">
                    <div className="upload-info">
                      <span className="upload-title">Upload PDF Document</span>
                      <span className="upload-sub">Drop your PDF here or browse files.</span>
                    </div>
                    <span className="btn-secondary">Browse Files</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setFileObject(e.target.files[0] || null)}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>

              <div className="status-banner" data-tone={formData.feeStatus === "Paid" ? "paid" : "pending"}>
                <span className="status-title">Auto-Assigned Status</span>
                <span className="status-value">{formData.feeStatus}</span>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-muted">Cancel</button>
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