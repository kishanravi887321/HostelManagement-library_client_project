import Library from "../models/Library.js"; // 💡 Using Library model to match your reset script
import Payment from "../models/Payment.js";

const collectFee = async (req, res) => {
  try {
    const { studentId, amountPaid, paymentMethod, month, year } = req.body;
    const normalizedPaymentMethod = String(paymentMethod || "cash").toLowerCase();

    // 1. Create a historical ledger entry in your new Payment collection
    const newPayment = await Payment.create({
      studentId,
      amountPaid: Number(amountPaid),
      paymentMethod: normalizedPaymentMethod,
      month,
      year
    });

    // 2. Keep the student's current active status updated for your frontend UI
    await Library.findByIdAndUpdate(studentId, {
      feeStatus: "Paid" // Matches the capitalization "Paid" in your reset script
    });

    res.status(201).json({ success: true, data: newPayment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export {
    collectFee
};
