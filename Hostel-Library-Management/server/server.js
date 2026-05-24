import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import {
  authRouter,
  dashboardRouter,
  hostelRouter,
  libraryRouter,
  studentRouter,
} from "./modules/index.js";
import "./utils/monthlyReset.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB connection (ONLY ONCE)
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// 🆕 Step 2: Serve the uploads folder statically so browsers can view files inside it
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

// Routes
app.use("/api/library", libraryRouter);
app.use("/api/hostel", hostelRouter);
app.use("/api/students", studentRouter);
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);

// Test route
app.get("/", (req, res) => {
  res.send("Hostel Library API Running");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});