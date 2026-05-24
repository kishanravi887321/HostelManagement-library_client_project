const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Student = require("../models/Student");

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
router.post("/add", upload.single("identityProof"), async (req, res) => {
  try {
    // Combine standard form text data with the newly generated filename
    const studentData = {
      ...req.body,
      identityProof: req.file ? req.file.filename : "No file uploaded"
    };

    const student = new Student(studentData);
    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE student
router.delete("/:id", async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedStudent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;