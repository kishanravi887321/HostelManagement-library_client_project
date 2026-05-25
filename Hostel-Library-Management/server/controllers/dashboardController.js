import Library from "../models/Library.js";
import Payment from "../models/Payment.js";
import Student from "../models/Student.js";
import { monthlyBillingCycleReset } from "../utils/monthlyReset.js";

const ADMIN_TOKEN = "secure_hostel_library_management_token_2026";

const getDashboardStats = async (req, res) => {
  try {
    const { month } = req.query; // e.g., "May", "April", "All Time Records"
    console.log("📥 Backend received filter month parameter:", month);

    let paymentMatch = {};
    let legacyProfileMatch = {};

    if (month && month !== "undefined" && month !== "All Time Records") {
      paymentMatch.month = month;

      const monthMap = {
        January: "-01-", February: "-02-", March: "-03-", April: "-04-",
        May: "-05-", June: "-06-", July: "-07-", August: "-08-",
        September: "-09-", October: "-10-", November: "-11-", December: "-12-"
      };

      const targetMonthString = monthMap[month];
      if (targetMonthString) {
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

    const hostelCount = await Student.countDocuments(legacyProfileMatch);
    const libraryCount = await Library.countDocuments(legacyProfileMatch);

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

    if (pMetric.totalPaid === 0) {
      console.log(`⚠️ Using dynamic monthly fallback filters for: ${month || "All Time"}`);

      const legacyHostel = await Student.aggregate([
        { $match: legacyProfileMatch },
        {
          $group: {
            _id: null,
            paid: { $sum: "$amountPaid" },
            cash: {
              $sum: {
                $cond: [
                  { $eq: [{ $toLower: "$paymentMode" }, "cash"] },
                  "$amountPaid",
                  {
                    $cond: [
                      { $eq: [{ $toLower: "$paymentMode" }, "split"] },
                      { $ifNull: ["$amountPaidCash", 0] },
                      0
                    ]
                  }
                ]
              }
            },
            online: {
              $sum: {
                $cond: [
                  { $eq: [{ $toLower: "$paymentMode" }, "online"] },
                  "$amountPaid",
                  {
                    $cond: [
                      { $eq: [{ $toLower: "$paymentMode" }, "split"] },
                      { $ifNull: ["$amountPaidOnline", 0] },
                      0
                    ]
                  }
                ]
              }
            }
          }
        }
      ]);

      const legacyLibrary = await Library.aggregate([
        { $match: legacyProfileMatch },
        {
          $group: {
            _id: null,
            paid: { $sum: { $add: ["$amountPaid", { $ifNull: ["$advanceAmount", 0] }] } },
            cash: {
              $sum: {
                $cond: [
                  { $eq: [{ $toLower: "$paymentMode" }, "cash"] },
                  { $add: ["$amountPaid", { $ifNull: ["$advanceAmount", 0] }] },
                  {
                    $cond: [
                      { $eq: [{ $toLower: "$paymentMode" }, "split"] },
                      { $ifNull: ["$amountPaidCash", 0] },
                      0
                    ]
                  }
                ]
              }
            },
            online: {
              $sum: {
                $cond: [
                  { $eq: [{ $toLower: "$paymentMode" }, "online"] },
                  { $add: ["$amountPaid", { $ifNull: ["$advanceAmount", 0] }] },
                  {
                    $cond: [
                      { $eq: [{ $toLower: "$paymentMode" }, "split"] },
                      { $ifNull: ["$amountPaidOnline", 0] },
                      0
                    ]
                  }
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
};

const runMonthlyResetNow = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await monthlyBillingCycleReset();
    return res.json({
      message: "Monthly reset executed successfully",
      ...result,
      executedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ Manual monthly reset failed:", err);
    return res.status(500).json({ message: err.message || "Monthly reset failed" });
  }
};

export {
    getDashboardStats,
    runMonthlyResetNow
};

