import Payment from "../../models/Payment.js";
import Library from "../../models/Library.js";

const collectFee = async (req, res) => {
  try {
    const { studentId, amountPaid, paymentMethod, month, year } = req.body;

    const newPayment = await Payment.create({
      studentId,
      amountPaid: Number(amountPaid),
      paymentMethod,
      month,
      year
    });

    await Library.findByIdAndUpdate(studentId, {
      feeStatus: "Paid"
    });

    res.status(201).json({ success: true, data: newPayment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export {
  collectFee
};
