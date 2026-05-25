import express from "express";
import multer from "multer";
import {
    addStudent,
    adjustAdvance,
    deleteStudent,
    getAdvance,
    getStudents,
    updateStudent,
} from "../controllers/studentController.js";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// ADD student (Updated to accept a single file named 'identityProof')
router.post("/add", upload.single("identityProof"), addStudent);

// GET all students
router.get("/", getStudents);

// DELETE student
router.delete("/:id", deleteStudent);

router.put("/:id", updateStudent);

router.get("/:id/advance", getAdvance);
router.post("/:id/advance", adjustAdvance);

export default router;