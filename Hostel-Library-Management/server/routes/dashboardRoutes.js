import express from "express";
import { getDashboardStats, runMonthlyResetNow } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/stats", getDashboardStats);
router.post("/run-monthly-reset", runMonthlyResetNow);

export default router;