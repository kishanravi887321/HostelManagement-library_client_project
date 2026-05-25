import Student from "../models/Student.js";

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const asBool = (v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true" || v === "1";
  return Boolean(v);
};

const createPaymentEntry = ({ amount, mode, appliedToDue = 0, addedToAdvance = 0, note = "" }) => ({
  amount,
  mode,
  appliedToDue,
  addedToAdvance,
  note,
  date: new Date()
});

const findNegativeField = (body, fields) => {
  for (const field of fields) {
    const value = body[field];
    if (value === undefined || value === null || value === "") continue;
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric < 0) return field;
  }
  return null;
};

const addStudent = async (req, res) => {
  try {
    const negativeField = findNegativeField(req.body, [
      "amountPaid",
      "amountPaidOnline",
      "amountPaidCash",
      "amountDue",
      "paymentReceivedNow",
      "paymentReceivedOnlineNow",
      "paymentReceivedCashNow",
      "advanceAmount",
      "advanceTopUp"
    ]);
    if (negativeField) {
      return res.status(400).json({ message: `${negativeField} cannot be negative` });
    }

    const incomingDue = Math.max(0, safeNum(req.body.amountDue));
    const paymentNow = Math.max(0, safeNum(req.body.paymentReceivedNow || req.body.amountPaid));
    const paymentOnlineNow = Math.max(0, safeNum(req.body.paymentReceivedOnlineNow || req.body.amountPaidOnline));
    const paymentCashNow = Math.max(0, safeNum(req.body.paymentReceivedCashNow || req.body.amountPaidCash));
    const explicitAdvanceTopUp = Math.max(0, safeNum(req.body.advanceAmount));

    let amountDue = incomingDue;
    let advance = 0;
    const payments = [];

    if (paymentNow > 0) {
      const appliedToDue = Math.min(paymentNow, amountDue);
      amountDue -= appliedToDue;
      const remaining = paymentNow - appliedToDue;

      // If admin explicitly provided opening wallet amount, trust that split and avoid double-crediting remaining.
      const autoAdvanceFromPayment = explicitAdvanceTopUp > 0 ? 0 : Math.max(0, remaining);
      advance += autoAdvanceFromPayment;

      payments.push(createPaymentEntry({
        amount: paymentNow,
        mode: req.body.paymentReceivedMode || req.body.paymentMode || "Mixed",
        appliedToDue,
        addedToAdvance: autoAdvanceFromPayment,
        note: "Initial payment during registration"
      }));
    }

    if (explicitAdvanceTopUp > 0) {
      advance += explicitAdvanceTopUp;
      payments.push(createPaymentEntry({
        amount: explicitAdvanceTopUp,
        mode: req.body.advanceTopUpMode || "TopUp",
        appliedToDue: 0,
        addedToAdvance: explicitAdvanceTopUp,
        note: "Opening advance wallet"
      }));
    }

    const totalPaid = Math.max(0, safeNum(req.body.amountPaid) || paymentNow);
    const totalPaidOnline = Math.max(0, safeNum(req.body.amountPaidOnline) || paymentOnlineNow);
    const totalPaidCash = Math.max(0, safeNum(req.body.amountPaidCash) || paymentCashNow);

    const studentData = {
      ...req.body,
      identityProof: req.file ? req.file.filename : (req.body.identityProof || ""),
      amountPaid: totalPaid,
      amountPaidOnline: totalPaidOnline,
      amountPaidCash: totalPaidCash,
      amountDue,
      advanceAmount: advance,
      payments,
      feeStatus: amountDue > 0 ? "Pending" : "Paid"
    };

    const student = new Student(studentData);
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json(err);
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json(err);
  }
};

const deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateStudent = async (req, res) => {
  try {
    const negativeField = findNegativeField(req.body, [
      "amountPaid",
      "amountPaidOnline",
      "amountPaidCash",
      "amountDue",
      "paymentReceivedNow",
      "paymentReceivedOnlineNow",
      "paymentReceivedCashNow",
      "advanceAmount",
      "advanceTopUp"
    ]);
    if (negativeField) {
      return res.status(400).json({ message: `${negativeField} cannot be negative` });
    }

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const paymentNow = Math.max(0, safeNum(req.body.paymentReceivedNow));
    const paymentOnlineNow = Math.max(0, safeNum(req.body.paymentReceivedOnlineNow));
    const paymentCashNow = Math.max(0, safeNum(req.body.paymentReceivedCashNow));
    let advance = Math.max(0, safeNum(student.advanceAmount));

    // Use DB due as source of truth so we do not double-subtract when frontend sends computed fields.
    let amountDue = Math.max(0, safeNum(student.amountDue));
    const manualDueProvided = req.body.amountDue !== undefined && req.body.amountDue !== null && req.body.amountDue !== "";

    if (manualDueProvided && paymentNow === 0 && !asBool(req.body.useAdvance)) {
      amountDue = Math.max(0, safeNum(req.body.amountDue));
    }

    const payments = student.payments ? [...student.payments] : [];

    const topUp = Math.max(0, safeNum(req.body.advanceTopUp));
    if (topUp > 0) {
      advance += topUp;
      payments.push(createPaymentEntry({ amount: topUp, mode: req.body.advanceTopUpMode || "TopUp", appliedToDue: 0, addedToAdvance: topUp, note: "Admin top-up" }));
    }

    if (asBool(req.body.useAdvance) && advance > 0 && amountDue > 0) {
      const applied = Math.min(advance, amountDue);
      amountDue -= applied;
      advance -= applied;
      payments.push(createPaymentEntry({ amount: applied, mode: "AdvanceApplied", appliedToDue: applied, addedToAdvance: 0, note: "Applied advance during update" }));
    }

    if (paymentNow > 0) {
      const appliedToDue = Math.min(paymentNow, amountDue);
      amountDue -= appliedToDue;
      const remaining = paymentNow - appliedToDue;
      if (remaining > 0) advance += remaining;

      payments.push(createPaymentEntry({ amount: paymentNow, mode: req.body.paymentReceivedMode || "Mixed", appliedToDue, addedToAdvance: remaining, note: "Payment received during update" }));

      student.amountPaid = Math.max(0, safeNum(student.amountPaid) + paymentNow);
      student.amountPaidOnline = Math.max(0, safeNum(student.amountPaidOnline) + paymentOnlineNow);
      student.amountPaidCash = Math.max(0, safeNum(student.amountPaidCash) + paymentCashNow);
      student.lastPaymentDate = new Date();
    }

    const allowed = ["name","phone","roomNo","sharingType","paymentMode","dateOfJoining","identityProof"];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) student[k] = req.body[k];
    });

    student.amountDue = Math.max(0, amountDue);
    student.advanceAmount = Math.max(0, advance);
    student.feeStatus = amountDue > 0 ? "Pending" : "Paid";
    student.payments = payments;

    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAdvance = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select("advanceAmount payments");
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ advanceAmount: student.advanceAmount, payments: student.payments || [] });
  } catch (err) {
    res.status(500).json(err);
  }
};

const adjustAdvance = async (req, res) => {
  try {
    const { amount = 0, note = "", mode = "Admin", operation = "credit" } = req.body;
    const n = safeNum(amount);
    if (n < 0) {
      return res.status(400).json({ message: "amount cannot be negative" });
    }
    const normalizedOperation = String(operation).toLowerCase() === "debit" ? "debit" : "credit";
    const delta = normalizedOperation === "debit" ? -n : n;

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const nextAdvance = safeNum(student.advanceAmount) + delta;
    if (nextAdvance < 0) {
      return res.status(400).json({ message: "Insufficient advance balance" });
    }

    student.advanceAmount = nextAdvance;
    const payments = student.payments || [];
    payments.push(createPaymentEntry({
      amount: n,
      mode,
      appliedToDue: 0,
      addedToAdvance: delta,
      note: note || (normalizedOperation === "debit" ? "Advance withdrawal" : "Advance top-up")
    }));
    student.payments = payments;
    await student.save();

    res.json({ advanceAmount: student.advanceAmount, payments: student.payments });
  } catch (err) {
    res.status(500).json(err);
  }
};

export {
    addStudent, adjustAdvance, deleteStudent, getAdvance, getStudents, updateStudent
};

