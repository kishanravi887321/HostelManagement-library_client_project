import cron from "node-cron";
import Library from "../models/Library.js";
import Student from "../models/Student.js";

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const createPaymentEntry = ({ amount, mode, appliedToDue = 0, addedToAdvance = 0, note = "" }) => ({
  amount,
  mode,
  appliedToDue,
  addedToAdvance,
  note,
  date: new Date()
});

const processMonthlyForModel = async (Model, label) => {
  const records = await Model.find();
  let changed = 0;

  for (const record of records) {
    const previousPaid = Math.max(0, safeNum(record.amountPaid));
    const previousDue = Math.max(0, safeNum(record.amountDue));

    // New month base fee is last month's full fee bucket (paid + due)
    const monthlyFee = previousPaid + previousDue;
    if (monthlyFee <= 0) continue;

    let advance = Math.max(0, safeNum(record.advanceAmount));
    let newDue = monthlyFee;
    let paidFromWallet = 0;

    if (advance > 0) {
      paidFromWallet = Math.min(advance, newDue);
      newDue -= paidFromWallet;
      advance -= paidFromWallet;
    }

    const payments = Array.isArray(record.payments) ? [...record.payments] : [];
    if (paidFromWallet > 0) {
      payments.push(createPaymentEntry({
        amount: paidFromWallet,
        mode: "AdvanceApplied",
        appliedToDue: paidFromWallet,
        addedToAdvance: 0,
        note: "Auto-applied from wallet on monthly reset"
      }));
    }

    record.amountPaid = paidFromWallet;
    record.amountPaidOnline = 0;
    record.amountPaidCash = 0;
    record.amountDue = Math.max(0, newDue);
    record.advanceAmount = Math.max(0, advance);
    record.feeStatus = newDue > 0 ? "Pending" : "Paid";
    record.payments = payments;
    await record.save();
    changed += 1;
  }

  if (changed > 0) {
    console.log(`[monthly-reset] ${label}: updated ${changed} records.`);
  }

  return changed;
};

const monthlyBillingCycleReset = async () => {
  try {
    const hostelUpdated = await processMonthlyForModel(Student, "Hostel");
    const libraryUpdated = await processMonthlyForModel(Library, "Library");
    console.log("[monthly-reset] Billing cycle reset completed.");
    return { hostelUpdated, libraryUpdated };
  } catch (error) {
    console.error("[monthly-reset] Error executing monthly reset:", error);
    throw error;
  }
};

// Runs at 00:05 on the 1st day of every month (server local timezone)
cron.schedule("5 0 1 * *", monthlyBillingCycleReset);

export { monthlyBillingCycleReset };
export default monthlyBillingCycleReset;