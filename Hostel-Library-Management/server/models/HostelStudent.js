import mongoose from "mongoose";

const hostelStudentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
    },

    roomNo: {
      type: String,
      required: true,
    },

    course: {
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

export default mongoose.model(
  "HostelStudent",
  hostelStudentSchema
);