import axios from "axios";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

const SeatGrid = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Library Seat Matrix</h2>
          <p className="text-sm text-gray-500 mt-1">Live overview of library desk occupancy</p>
        </div>
        <button 
          onClick={fetchStudents}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition duration-150"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
          ⚠️ {error}
        </div>
      )}

      {/* Grid Display */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-w-md mx-auto justify-items-center">
        {Array.from({ length: 41 }, (_, i) => { 
          const seat = i + 1;
          const student = getOccupyingStudent(seat);
          const isOccupied = !!student;

          return (
            <button
              key={seat}
              onClick={() => handleClick(seat)}
              className={`w-16 h-16 rounded-xl font-bold text-white flex flex-col items-center justify-center shadow-sm transform transition active:scale-95 duration-100 ${
                isOccupied 
                  ? "bg-red-500 hover:bg-red-600 shadow-red-100" 
                  : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100"
              }`}
            >
              <span className="text-sm">#{seat}</span>
              {isOccupied && <span className="text-[9px] font-normal tracking-wide uppercase opacity-90 mt-0.5">Busy</span>}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center mt-6 pt-4 border-t border-gray-50 text-xs font-medium text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block"></span>
          <span>Available (Click to Assign)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span>
          <span>Occupied ({students.length})</span>
        </div>
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
                <button type="button" onClick={closeModal} className="px-4 py-2 font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="px-5 py-2 font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 rounded-lg shadow-sm transition">
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