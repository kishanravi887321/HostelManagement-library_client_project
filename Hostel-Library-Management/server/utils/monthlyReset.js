const Library = require("../models/Library");
const Payment = require("../models/Payment"); // 💡 Import your new Payment model

const monthlyBillingCycleReset = async () => {
  try {
    const students = await Library.find();

    // Get the month and year that just finished to archive them correctly
    // If it's June 1st today, we are archiving the payments for May
    const date = new Date();
    date.setMonth(date.getMonth() - 1); 
    const targetMonth = date.toLocaleString('default', { month: 'long' }); // e.g., "May"
    const targetYear = date.getFullYear(); // e.g., 2026

    for (let student of students) {
      // 1. ARCHIVE PREVIOUS MONTH'S PAYMENT BEFORE WIPING IT
      // Only archive if they actually paid something last month
      if (student.amountPaid > 0) {
        await Payment.create({
          studentId: student._id,
          amountPaid: student.amountPaid,
          paymentMethod: "cash", // Or default to a string fallback like "wallet/cash"
          month: targetMonth,
          year: targetYear
        });
      }

      // 2. YOUR ORIGINAL SMART WALLET & ROLLOVER LOGIC CONTINUES HERE
      const previousPaid = student.amountPaid || 0;
      const previousDue = student.amountDue || 0;
      const customMonthlyFee = previousPaid + previousDue;

      // Skip processing if a baseline fee hasn't been established yet for this record
      if (customMonthlyFee <= 0) continue;

      let currentAdvance = student.advanceBalance || 0;

      if (currentAdvance >= customMonthlyFee) {
        // Wallet completely covers their custom charge for the upcoming month
        student.advanceBalance = currentAdvance - customMonthlyFee;
        student.amountPaid = customMonthlyFee;
        student.amountDue = 0;
        student.feeStatus = "Paid";

        // 🆕 Since their advance balance is instantly covering the NEW month, 
        // we log this new automated payment record right away so the dashboard sees it!
        await Payment.create({
          studentId: student._id,
          amountPaid: customMonthlyFee,
          paymentMethod: "online", 
          month: new Date().toLocaleString('default', { month: 'long' }), // The fresh month
          year: new Date().getFullYear()
        });

      } else if (currentAdvance > 0 && currentAdvance < customMonthlyFee) {
        // Wallet partially covers their custom cost
        student.amountPaid = currentAdvance;
        student.amountDue = customMonthlyFee - currentAdvance;
        student.advanceBalance = 0;
        student.feeStatus = "Pending";

        // 🆕 Log the partial payment from their advance balance
        await Payment.create({
          studentId: student._id,
          amountPaid: currentAdvance,
          paymentMethod: "online",
          month: new Date().toLocaleString('default', { month: 'long' }),
          year: new Date().getFullYear()
        });

      } else {
        // Wallet is empty, roll over standard recurring billing parameters
        student.amountPaid = 0;
        student.amountDue = customMonthlyFee;
        student.feeStatus = "Pending";
      }

      await student.save();
    }
    console.log("Monthly billing cycle processed and historical payments safely archived!");
  } catch (error) {
    console.error("Error executing monthly balance rollover routine:", error);
  }
};

module.exports = monthlyBillingCycleReset;