import express from "express";
import {
  addHostelStudent,
  getHostelStudents,
} from "../controllers/hostelController.js";

const router = express.Router();

router.post("/", addHostelStudent);

router.get("/", getHostelStudents);

export default router;