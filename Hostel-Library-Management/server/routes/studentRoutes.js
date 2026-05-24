import express from "express";
import multer from "multer";
import path from "path";
import {
  addStudent,
  getStudents,
  deleteStudent,
  updateStudent,
} from "../controllers/studentController.js";

const router = express.Router();

// Configure how and where files are stored
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Drops the file into your server/uploads folder
  },
  filename: (req, file, cb) => {
    // Saves file with a timestamp so filenames never clash
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});

const upload = multer({ storage: storage });

// ADD student (Updated to accept a single file named 'identityProof')
router.post("/add", upload.single("identityProof"), addStudent);

// GET all students
router.get("/", getStudents);

// DELETE student
router.delete("/:id", deleteStudent);

router.put("/:id", updateStudent);

export default router;