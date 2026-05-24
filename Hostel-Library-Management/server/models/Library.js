const mongoose = require("mongoose");

const LibrarySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  studentType: { type: String, default: "Hosteler" },
  seatNo: { type: String, required: true },
  feeStatus: { type: String, default: "Pending" },
  amountPaid: { type: Number, default: 0 },
  amountDue: { type: Number, default: 0 },
  // 🆕 ADD THIS FIELD: Tracks advanced surplus payments cleanly
  advanceBalance: { type: Number, default: 0 }, 
  lastPaymentDate: { type: Date },
  dateOfJoining: { type: Date },
  paymentMode: { type: String, default: "Online" },
  identityProof: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Library", LibrarySchema);