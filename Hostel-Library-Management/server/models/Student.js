import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  roomNo: { type: String, required: true },
  feeStatus: { type: String, default: "Pending" },
  
  // 🔒 Isolated hostel additions for structural record keeping
  sharingType: { type: String, enum: ["Single", "Double Sharing"], default: "Single" },
  amountPaid: { type: Number, default: 0 },
  amountPaidOnline: { type: Number, default: 0 },
  amountPaidCash: { type: Number, default: 0 },
  amountDue: { type: Number, default: 0 },
  // Advance balance that can be applied to future dues
  advanceAmount: { type: Number, default: 0 },
  // Payments log for audit trail
  payments: [
    {
      amount: { type: Number, required: true },
      mode: { type: String },
      date: { type: Date, default: Date.now },
      appliedToDue: { type: Number, default: 0 },
      addedToAdvance: { type: Number, default: 0 },
      note: { type: String }
    }
  ],
  paymentMode: { type: String, enum: ["Online", "Cash", "Split"], default: "Online" },
  dateOfJoining: { type: String }, 
  lastPaymentDate: { type: String },
  identityProof: { type: String } 
}, { timestamps: true }); // Automatically creates historical 'createdAt' and 'updatedAt' tracking fields

export default mongoose.model("Student", StudentSchema);