import express from "express";
import { getAllTransactions } from "../controllers/transactionController.js";

const router = express.Router();

// GET /api/transactions  -> returns combined transactions from hostel and library
router.get("/", getAllTransactions);

export default router;
