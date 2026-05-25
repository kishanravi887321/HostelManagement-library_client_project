import express from "express";
import multer from "multer";
import {
    addLibraryStudent,
    adjustAdvance,
    deleteLibraryStudent,
    getAdvance,
    getLibraryStudents,
    updateLibraryStudent,
} from "../controllers/libraryController.js";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// ================= POST: ADD STUDENT =================
router.post("/add", upload.single("identityProof"), addLibraryStudent);

// ================= GET: FETCH ALL STUDENTS =================
router.get("/", getLibraryStudents);

// ================= PUT: UPDATE STUDENT =================
router.put("/:id", updateLibraryStudent);

// GET advance balance + payments
router.get("/:id/advance", getAdvance);

// POST adjust advance (credit/debit)
router.post("/:id/advance", adjustAdvance);

// ================= ADDED: DELETE STUDENT =================
router.delete("/:id", deleteLibraryStudent);

export default router;