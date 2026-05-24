import express from "express";
import Library from "../models/Library.js";
import multer from "multer"; // 1. 🆕 Import multer
import path from "path";

const router = express.Router();

// 2. 🆕 Configure how files are saved locally
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Make sure this folder exists in your backend root!
  },
  filename: (req, file, cb) => {
    // Saves file with timestamp prefix to prevent overlapping filenames
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// ================= POST: ADD STUDENT =================
router.post("/add", upload.single("identityProof"), async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const inputPaid = Number(req.body.amountPaid) || 0;
    const inputDue = Number(req.body.amountDue) || 0;

    let finalAmountPaid = inputPaid;
    let finalAmountDue = inputDue;
    let finalAdvanceBalance = 0;

    // 🆕 Dynamic Advance Accounting
    // If the admin records an upfront payment and explicitly sets Due as 0,
    // any amount greater than the regular due structure can be handled via custom calculations.
    // To handle true advance tracking where an admin types a large payment amount:
    if (inputPaid > 0 && inputDue < 0) {
      // If the calculation lands as a negative due value from custom manual entries
      finalAdvanceBalance = Math.abs(inputDue); 
      finalAmountDue = 0;
    } else if (req.body.isAdvancePayment === "true" || req.body.isAdvancePayment === true) {
      // Direct backup check flag if passed explicitly
      finalAdvanceBalance = inputPaid;
      finalAmountPaid = 0;
      finalAmountDue = 0;
    }

    // Safely assign calculated variables back to the data schema payload
    const studentData = {
      ...req.body,
      amountPaid: finalAmountPaid,
      amountDue: finalAmountDue,
      advanceBalance: finalAdvanceBalance,
      feeStatus: finalAmountDue > 0 ? "Pending" : "Paid"
    };

    if (req.file) {
      studentData.identityProof = req.file.filename;
    }

    const data = new Library(studentData);
    await data.save();

    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// ================= GET: FETCH ALL STUDENTS =================
router.get("/", async (req, res) => {
  try {
    const data = await Library.find();
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ================= PUT: UPDATE STUDENT =================
router.put("/:id", async (req, res) => {
  try {
    const updated = await Library.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// ================= ADDED: DELETE STUDENT =================
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Library.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Student record not found" });
    }

    res.json({ message: "Student deleted successfully", deleted });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

export default router;