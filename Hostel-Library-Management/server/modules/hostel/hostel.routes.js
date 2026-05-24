import express from "express";
import {
  addHostelStudent,
  getHostelStudents,
} from "./hostel.controller.js";

const router = express.Router();

router.post("/", addHostelStudent);
router.get("/", getHostelStudents);

export default router;
