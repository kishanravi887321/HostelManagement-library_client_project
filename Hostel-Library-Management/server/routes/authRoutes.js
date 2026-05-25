import express from "express";
import {
	getCredentials,
	login,
	updateCredentials,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.get("/credentials", getCredentials);
router.put("/credentials", updateCredentials);

export default router;
