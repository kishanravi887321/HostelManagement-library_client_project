import express from "express";
import { getGreetingAndDaily } from "../controllers/utilsController.js";

const router = express.Router();

router.get("/greeting", getGreetingAndDaily);

export default router;
