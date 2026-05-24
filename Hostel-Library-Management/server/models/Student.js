import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  roomNo: { type: String, required: true },
  feeStatus: { type: String, default: "Pending" },
  
  // 🔒 Isolated hostel additions for structural record keeping
  sharingType: { type: String, enum: ["Single", "Double Sharing"], default: "Single" },
  amountPaid: { type: Number, default: 0 },
  amountDue: { type: Number, default: 0 },
  paymentMode: { type: String, enum: ["Online", "Cash"], default: "Online" },
  isAdvancePayment: { type: Boolean, default: false },
  dateOfJoining: { type: String }, 
  lastPaymentDate: { type: String },
  identityProof: { type: String } 
}, { timestamps: true }); // Automatically creates historical 'createdAt' and 'updatedAt' tracking fields

export default mongoose.model("Student", StudentSchema);