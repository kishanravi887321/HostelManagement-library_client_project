import mongoose from "mongoose";

const LibrarySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  studentType: { type: String, default: "Hosteler" },
  seatNo: { type: String, required: true },
  feeStatus: { type: String, default: "Pending" },
  amountPaid: { type: Number, default: 0 },
  amountPaidOnline: { type: Number, default: 0 },
  amountPaidCash: { type: Number, default: 0 },
  amountDue: { type: Number, default: 0 },
  // Advance balance and payments log to support prepayments
  advanceAmount: { type: Number, default: 0 },
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
  lastPaymentDate: { type: Date },
  dateOfJoining: { type: Date },
  paymentMode: { type: String, enum: ["Online", "Cash", "Split"], default: "Online" },
  identityProof: { type: String }
}, { timestamps: true });

export default mongoose.model("Library", LibrarySchema);