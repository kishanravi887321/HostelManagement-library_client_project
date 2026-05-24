const mongoose = require("mongoose");

const libraryStudentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
    },

    seatNo: {
      type: String,
      required: true,
    },

    timing: {
      type: String,
    },

    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending"],
      default: "Pending",
    },

    feesAmount: {
      type: Number,
      default: 0,
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "LibraryStudent",
  libraryStudentSchema
);