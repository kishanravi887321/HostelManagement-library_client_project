import axios from "axios";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

export default function StudentDirectory() {
  const [hostelStudents, setHostelStudents] = useState([]);
  const [libraryStudents, setLibraryStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hostelRes, libraryRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/students`),
        axios.get(`${API_BASE_URL}/api/library`)
      ]);
      setHostelStudents(Array.isArray(hostelRes.data) ? hostelRes.data : []);
      setLibraryStudents(Array.isArray(libraryRes.data) ? libraryRes.data : []);
    } catch (err) {
      console.error("Error fetching master directories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();
  }, []);

  // 🧠 SMART UNIFICATION LOGIC: Handles duplicate names securely using phone numbers
  const unifiedProfiles = [];

  // Track library records we've already merged so we don't duplicate them
  const matchedLibraryIds = new Set();

  // Step 1: Loop through all Hostel students
  hostelStudents.forEach((hStudent) => {
    const hPhone = hStudent.phone?.trim();
    const hName = hStudent.name?.trim().toLowerCase();

    // Look for a matching library student by phone first, fallback to name only if phone is missing
    const libraryMatch = libraryStudents.find((lStudent) => {
      const lPhone = lStudent.phone?.trim();
      const lName = lStudent.name?.trim().toLowerCase();
      
      if (hPhone && lPhone) {
        return hPhone === lPhone; // Best unique match
      }
      return hName === lName; // Fallback if phone data is missing
    });

    if (libraryMatch) {
      matchedLibraryIds.add(libraryMatch._id);
    }

    unifiedProfiles.push({
      name: hStudent.name,
      phone: hStudent.phone || "N/A",
      identityProof: hStudent.identityProof || "No file uploaded",
      isHosteler: true,
      roomNo: hStudent.roomNo,
      sharingType: hStudent.sharingType,
      hostelPaid: Number(hStudent.amountPaid || 0),
      hostelDue: Number(hStudent.amountDue || 0),
      hostelStatus: hStudent.feeStatus,
      hostelJoining: hStudent.dateOfJoining,

      isLibraryMember: !!libraryMatch,
      seatNo: libraryMatch ? libraryMatch.seatNo : "No Assigned Seat",
      studentType: libraryMatch ? libraryMatch.studentType : "Hosteler (No Library)",
      libraryPaid: libraryMatch ? Number(libraryMatch.amountPaid || 0) : 0,
      libraryDue: libraryMatch ? Number(libraryMatch.amountDue || 0) : 0,
      libraryStatus: libraryMatch ? libraryMatch.feeStatus : null,
      libraryJoining: libraryMatch ? libraryMatch.dateOfJoining : null
    });
  });

  // Step 2: Add remaining Library students who were NOT matched to a hostel resident
  libraryStudents.forEach((lStudent) => {
    if (!matchedLibraryIds.has(lStudent._id)) {
      unifiedProfiles.push({
        name: lStudent.name,
        phone: lStudent.phone || "N/A",
        identityProof: lStudent.identityProof || "No file uploaded",
        isHosteler: false,
        roomNo: "Not registered in Hostel",
        sharingType: null,
        hostelPaid: 0,
        hostelDue: 0,
        hostelStatus: null,
        hostelJoining: null,

        isLibraryMember: true,
        seatNo: lStudent.seatNo,
        studentType: lStudent.studentType || "Day Scholar",
        libraryPaid: Number(lStudent.amountPaid || 0),
        libraryDue: Number(lStudent.amountDue || 0),
        libraryStatus: lStudent.feeStatus,
        libraryJoining: lStudent.dateOfJoining
      });
    }
  });

  // Filter list based on Search Bar text
  const filteredProfiles = unifiedProfiles.filter((student) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const matchName = student.name?.toLowerCase().includes(query);
    const matchRoom = student.roomNo?.toString().toLowerCase().includes(query);
    const matchSeat = student.seatNo?.toString().toLowerCase().includes(query);

    return matchName || matchRoom || matchSeat;
  });

  return (
    <div className="space-y-8">
      <div className="panel p-6">
        <h1 className="text-3xl font-semibold text-slate-900">Master Student Directory</h1>
        <p className="text-sm text-slate-500 mt-1">Cross-reference profiles with verified contact markers.</p>
      </div>

      {/* 🔍 SEARCH BAR */}
      <div className="panel p-4">
        <div className="relative">
          <input
            type="text"
            className="w-full border border-[var(--border)] p-3 pl-10 rounded-lg text-sm bg-white"
            placeholder="Search student profiles by Name, Room Number, or Library Seat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-3 top-3.5 text-gray-400 text-sm">🔍</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-sm text-gray-500 py-12">Compiling master profiles directory...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT SIDE: LIST OF STUDENTS */}
          <div className="lg:col-span-1 panel overflow-hidden h-[60vh] flex flex-col">
            <div className="bg-white/70 p-3 font-semibold text-xs text-gray-500 uppercase border-b border-gray-100">
              Matching Records ({filteredProfiles.length})
            </div>
            <div className="divide-y overflow-y-auto flex-1">
              {filteredProfiles.map((student, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-3 text-sm cursor-pointer transition flex justify-between items-center ${
                    selectedStudent?.name === student.name && selectedStudent?.phone === student.phone
                      ? "bg-emerald-50 border-l-4 border-emerald-600" 
                      : "hover:bg-emerald-50/40"
                  }`}
                >
                  <div>
                    <h3 className="font-medium text-gray-800">{student.name}</h3>
                    <p className="text-xs text-gray-400 font-medium">📞 {student.phone}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {student.isHosteler && (
                      <span className="bg-orange-50 text-orange-700 text-[10px] px-1.5 py-0.5 rounded font-bold border border-orange-100">Hostel</span>
                    )}
                    {student.isLibraryMember && (
                      <span className="bg-green-50 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-bold border border-green-100">Library</span>
                    )}
                  </div>
                </div>
              ))}
              {filteredProfiles.length === 0 && (
                <div className="text-center p-6 text-xs text-gray-400">No student profile records match your search query.</div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: PROFILE DETAIL VIEW */}
          <div className="lg:col-span-2">
            {selectedStudent ? (
              <div className="panel space-y-6 p-6">
                
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedStudent.name}</h2>
                    <p className="text-sm font-medium text-gray-500 mt-0.5">Primary Contact: {selectedStudent.phone}</p>
                  </div>
                  {/* 📄 UPDATED RE-ROUTEABLE IDENTITY PROOF PDF LINK */}
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Identity Document</span>
                    {selectedStudent.identityProof && selectedStudent.identityProof !== "No file uploaded" ? (
                      <a 
                        href={`${API_BASE_URL}/uploads/${selectedStudent.identityProof}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-emerald-700 underline bg-emerald-50 hover:bg-emerald-100 transition px-2 py-1 rounded block mt-1 border border-emerald-100 cursor-pointer text-center"
                      >
                        📄 View {selectedStudent.identityProof}
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded block mt-1 border border-gray-200 text-center">
                        ❌ No file uploaded
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* ====== HOSTEL CARD ====== */}
                  <div className="panel-soft p-4 relative overflow-hidden">
                    <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wide border-b pb-1.5 mb-3 flex items-center gap-1.5">
                      <span>🏠</span> Hostel Residency Profile
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-400">Status:</span> <span className="font-semibold">{selectedStudent.isHosteler ? "Registered Resident" : "Not a Resident"}</span></div>
                      {selectedStudent.isHosteler && (
                        <>
                          <div className="flex justify-between"><span className="text-gray-400">Room Number:</span> <span className="font-bold text-gray-800">Room #{selectedStudent.roomNo}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Sharing Mode:</span> <span className="font-medium text-gray-600">{selectedStudent.sharingType}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Date Joined:</span> <span className="font-medium text-gray-600">{selectedStudent.hostelJoining || "N/A"}</span></div>
                          <div className="border-t pt-2 mt-2 space-y-1">
                            <div className="flex justify-between text-xs"><span className="text-gray-400">Fees Paid:</span> <span className="text-green-600 font-bold">₹{selectedStudent.hostelPaid}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-gray-400">Fees Due:</span> <span className="text-red-500 font-bold">₹{selectedStudent.hostelDue}</span></div>
                            <div className="flex justify-between pt-1 font-bold text-xs"><span className="text-gray-500">Fee Status:</span> <span className={selectedStudent.hostelStatus === "Paid" ? "text-green-600" : "text-red-500"}>{selectedStudent.hostelStatus}</span></div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ====== LIBRARY CARD ====== */}
                  <div className="panel-soft p-4 relative overflow-hidden">
                    <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide border-b pb-1.5 mb-3 flex items-center gap-1.5">
                      <span>📚</span> Library Membership Profile
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-400">Status:</span> <span className="font-semibold">{selectedStudent.isLibraryMember ? "Active Member" : "No Active Membership"}</span></div>
                      {selectedStudent.isLibraryMember && (
                        <>
                          <div className="flex justify-between"><span className="text-gray-400">Assigned Seat:</span> <span className="font-bold text-gray-800">Seat {selectedStudent.seatNo}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Classification:</span> <span className="font-medium text-gray-600">{selectedStudent.studentType}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400">Date Subscribed:</span> <span className="font-medium text-gray-600">{selectedStudent.libraryJoining || "N/A"}</span></div>
                          <div className="border-t pt-2 mt-2 space-y-1">
                            <div className="flex justify-between text-xs"><span className="text-gray-400">Fees Paid:</span> <span className="text-green-600 font-bold">₹{selectedStudent.libraryPaid}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-gray-400">Fees Due:</span> <span className="text-red-500 font-bold">₹{selectedStudent.libraryDue}</span></div>
                            <div className="flex justify-between pt-1 font-bold text-xs"><span className="text-gray-500">Subscription Status:</span> <span className={selectedStudent.libraryStatus === "Paid" ? "text-green-600" : "text-red-500"}>{selectedStudent.libraryStatus}</span></div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                </div>

                {/* Bottom Total Block */}
                <div className="bg-gradient-to-r from-teal-700 via-emerald-600 to-amber-500 p-4 rounded-lg text-white grid grid-cols-3 text-center">
                  <div>
                    <span className="text-[10px] uppercase opacity-75 font-semibold block">Total Paid</span>
                    <span className="text-xl font-bold">₹{selectedStudent.hostelPaid + selectedStudent.libraryPaid}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase opacity-75 font-semibold block">Total Balance Due</span>
                    <span className="text-xl font-bold">₹{selectedStudent.hostelDue + selectedStudent.libraryDue}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase opacity-75 font-semibold block">Cross Platform Status</span>
                    <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded inline-block mt-1">
                      {selectedStudent.isHosteler && selectedStudent.isLibraryMember ? "Dual Enrolled" : selectedStudent.isHosteler ? "Hostel Resident Only" : "Library Member Only"}
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl h-full flex flex-col justify-center items-center p-12 text-gray-400">
                <span className="text-4xl mb-2">👤</span>
                <p className="text-sm font-medium">Select a student record from the directory to look up their complete cross-platform profile details.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}