const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Library", // 💡 Changed to "Library" to match your monthlyReset model
    required: true
  },
  amountPaid: {
    type: Number,
    required: true,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "online"],
    default: "cash"
  },
  month: {
    type: String, // e.g., "May"
    required: true
  },
  year: {
    type: Number, // e.g., 2026
    required: true
  },
  paidAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);