import express from "express";
import multer from "multer"; // 1. 🆕 Import multer
import path from "path";
import {
  addLibraryStudent,
  getLibraryStudents,
  updateLibraryStudent,
  deleteLibraryStudent,
} from "../controllers/libraryController.js";

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
router.post("/add", upload.single("identityProof"), addLibraryStudent);

// ================= GET: FETCH ALL STUDENTS =================
router.get("/", getLibraryStudents);

// ================= PUT: UPDATE STUDENT =================
router.put("/:id", updateLibraryStudent);

// ================= ADDED: DELETE STUDENT =================
router.delete("/:id", deleteLibraryStudent);

export default router;