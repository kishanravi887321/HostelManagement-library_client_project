const express = require("express");

const router = express.Router();

const {
  addHostelStudent,
  getHostelStudents,
} = require("../controllers/hostelController");

router.post("/", addHostelStudent);

router.get("/", getHostelStudents);

module.exports = router;