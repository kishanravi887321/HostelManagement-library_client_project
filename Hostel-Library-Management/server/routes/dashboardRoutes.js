import express from "express";
import Student from "../models/Student.js";
import Library from "../models/Library.js";
import Payment from "../models/Payment.js";

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const { month } = req.query; // e.g., "May", "April", "All Time Records"
    console.log("📥 Backend received filter month parameter:", month);

    // Set up match queries for our collections
    let paymentMatch = {};
    let legacyProfileMatch = {};

    if (month && month !== "undefined" && month !== "All Time Records") {
      // For the new Ledger collection
      paymentMatch.month = month;

      // Map month text names to numerical strings for legacy date fields
      const monthMap = {
        January: "-01-", February: "-02-", March: "-03-", April: "-04-",
        May: "-05-", June: "-06-", July: "-07-", August: "-08-",
        September: "-09-", October: "-10-", November: "-11-", December: "-12-"
      };
      
      const targetMonthString = monthMap[month];
      if (targetMonthString) {
        // Matches profiles whose lastPaymentDate falls within the filtered month
        legacyProfileMatch = {
          $expr: {
            $regexMatch: {
              input: { $toString: "$lastPaymentDate" },
              regex: targetMonthString
            }
          }
        };
      }
    }

    // 1. ✅ FIXED: Dynamically count students belonging to the filtered period
    const hostelCount = await Student.countDocuments(legacyProfileMatch);
    const libraryCount = await Library.countDocuments(legacyProfileMatch);

    // 2. Try aggregating from the new permanent Payment collection first
    const paymentMetrics = await Payment.aggregate([
      { $match: paymentMatch },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amountPaid" },
          cashPaid: {
            $sum: { $cond: [{ $eq: [{ $toLower: "$paymentMethod" }, "cash"] }, "$amountPaid", 0] }
          },
          onlinePaid: {
            $sum: { $cond: [{ $eq: [{ $toLower: "$paymentMethod" }, "online"] }, "$amountPaid", 0] }
          }
        }
      }
    ]);

    let pMetric = paymentMetrics[0] || { totalPaid: 0, cashPaid: 0, onlinePaid: 0 };

    // 3. FALLBACK: Factor advance balances into payment modes equally!
    if (pMetric.totalPaid === 0) {
      console.log(`⚠️ Using dynamic monthly fallback filters for: ${month || "All Time"}`);

      const legacyHostel = await Student.aggregate([
        { $match: legacyProfileMatch },
        {
          $group: {
            _id: null,
            paid: { $sum: "$amountPaid" },
            cash: { $sum: { $cond: [{ $eq: [{ $toLower: "$paymentMode" }, "cash"] }, "$amountPaid", 0] } },
            online: { $sum: { $cond: [{ $eq: [{ $toLower: "$paymentMode" }, "online"] }, "$amountPaid", 0] } }
          }
        }
      ]);

      const legacyLibrary = await Library.aggregate([
        { $match: legacyProfileMatch },
        {
          $group: {
            _id: null,
            paid: { $sum: { $add: ["$amountPaid", { $ifNull: ["$advanceBalance", 0] }] } },
            cash: { 
              $sum: { 
                $cond: [
                  { $eq: [{ $toLower: "$paymentMode" }, "cash"] }, 
                  { $add: ["$amountPaid", { $ifNull: ["$advanceBalance", 0] }] }, 
                  0
                ] 
              } 
            },
            online: { 
              $sum: { 
                $cond: [
                  { $eq: [{ $toLower: "$paymentMode" }, "online"] }, 
                  { $add: ["$amountPaid", { $ifNull: ["$advanceBalance", 0] }] }, 
                  0
                ] 
              } 
            }
          }
        }
      ]);

      const hLegacy = legacyHostel[0] || { paid: 0, cash: 0, online: 0 };
      const lLegacy = legacyLibrary[0] || { paid: 0, cash: 0, online: 0 };

      pMetric = {
        totalPaid: hLegacy.paid + lLegacy.paid,
        cashPaid: hLegacy.cash + lLegacy.cash,
        onlinePaid: hLegacy.online + lLegacy.online
      };
    }

    // 4. ✅ FIXED: Calculate dynamic pending fees matching the filter context
    const activeHostelDues = await Student.aggregate([
      { $match: legacyProfileMatch },
      { $group: { _id: null, totalDue: { $sum: "$amountDue" } } }
    ]);
    const activeLibraryDues = await Library.aggregate([
      { $match: legacyProfileMatch },
      { $group: { _id: null, totalDue: { $sum: "$amountDue" } } }
    ]);

    const hDue = activeHostelDues[0]?.totalDue || 0;
    const lDue = activeLibraryDues[0]?.totalDue || 0;

    res.json({
      hostelCount,
      libraryCount,
      pendingFees: hDue + lDue,
      paidFees: pMetric.totalPaid,
      cashRevenue: pMetric.cashPaid,      
      onlineRevenue: pMetric.onlinePaid 
    });

  } catch (err) {
    console.error("❌ Aggregation failed:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;