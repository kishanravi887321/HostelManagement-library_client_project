import Library from "../models/Library.js";
import Student from "../models/Student.js";

// Build aggregation fragment to filter payments according to query
const buildMatch = ({ from, to, source, studentName, mode }) => {
  const match = {};
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      match.date.$lte = d;
    }
  }
  if (mode) match.mode = mode;
  if (studentName) {
    // treat the provided search term as full-text across studentName and note
    const re = { $regex: studentName, $options: "i" };
    match.$or = [{ studentName: re }, { note: re }];
  }
  // source will be handled outside
  return match;
};

// helper to run aggregation on a collection (Student/Library)
const aggregatePayments = async (Model, sourceLabel, opts) => {
  const { from, to, studentName, mode, skip = 0, limit = 100 } = opts;
  const match = buildMatch({ from, to, studentName, mode });

  const pipeline = [
    { $project: { name: 1, payments: 1 } },
    { $unwind: "$payments" },
    { $addFields: {
      studentId: "$_id",
      studentName: "$name",
      amount: "$payments.amount",
      mode: "$payments.mode",
      appliedToDue: "$payments.appliedToDue",
      addedToAdvance: "$payments.addedToAdvance",
      note: "$payments.note",
      date: "$payments.date",
      source: sourceLabel
    } },
    { $replaceRoot: { newRoot: {
      studentId: "$studentId",
      studentName: "$studentName",
      amount: "$amount",
      mode: "$mode",
      appliedToDue: "$appliedToDue",
      addedToAdvance: "$addedToAdvance",
      note: "$note",
      date: "$date",
      source: "$source"
    } } }
  ];

  // apply match conditions
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  // sort by date desc
  pipeline.push({ $sort: { date: -1 } });

  // pagination
  if (skip) pipeline.push({ $skip: Number(skip) });
  if (limit) pipeline.push({ $limit: Number(limit) });

  return Model.aggregate(pipeline).exec();
};

const getAllTransactions = async (req, res) => {
  try {
    const { from, to, source, studentName, mode, page = 1, pageSize = 100, export: exportType } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Number(pageSize || 100);
    const limit = Number(pageSize) || 100;

    const opts = { from, to, studentName, mode, skip, limit };

    let results = [];

    if (!source || source === "Hostel") {
      const s = await aggregatePayments(Student, "Hostel", opts);
      results = results.concat(s);
    }

    if (!source || source === "Library") {
      const l = await aggregatePayments(Library, "Library", opts);
      results = results.concat(l);
    }

    // merged results are already sorted per-collection; do a final sort
    results.sort((a, b) => {
      const da = a.date ? new Date(a.date) : 0;
      const db = b.date ? new Date(b.date) : 0;
      return db - da;
    });

    if (exportType === "csv") {
      const header = ["date","student","source","amount","mode","appliedToDue","addedToAdvance","note"];
      const rows = results.map((r) => [
        r.date ? new Date(r.date).toISOString() : "",
        r.studentName || "",
        r.source || "",
        r.amount ?? "",
        r.mode || "",
        r.appliedToDue ?? 0,
        r.addedToAdvance ?? 0,
        r.note ? String(r.note) : ""
      ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","));

      const csv = [header.join(","), ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="transactions_${new Date().toISOString()}.csv"`);
      return res.send(csv);
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export { getAllTransactions };
