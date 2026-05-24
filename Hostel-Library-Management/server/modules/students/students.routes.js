import express from "express";
import multer from "multer";
import path from "path";
import {
  addStudent,
  getStudents,
  deleteStudent,
  updateStudent,
} from "./students.controller.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.post("/add", upload.single("identityProof"), addStudent);
router.get("/", getStudents);
router.delete("/:id", deleteStudent);
router.put("/:id", updateStudent);

export default router;
