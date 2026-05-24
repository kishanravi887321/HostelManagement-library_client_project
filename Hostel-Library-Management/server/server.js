import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path"; // 🆕 Imported path module for managing file paths
import { fileURLToPath } from "url";
import libraryRoutes from "./routes/libraryRoutes.js";
import connectDB from "./config/db.js";
import studentRoutes from "./routes/studentRoutes.js";
import hostelRoutes from "./routes/hostelRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import authRoutes from "./routes/authRoutes.js";
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
app.use("/api/library", libraryRoutes);
app.use("/api/hostel", hostelRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Hostel Library API Running");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});