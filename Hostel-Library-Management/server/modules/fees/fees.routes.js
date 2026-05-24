import express from "express";
import { collectFee } from "./fees.controller.js";

const router = express.Router();

router.post("/collect", collectFee);

export default router;
